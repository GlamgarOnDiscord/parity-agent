// Migration mode, opt-in: a whole legacy app rather than one screen, screen by screen, each one proved.
// parity migrate inventory <migration.json>        crawl the legacy app by its links (no model call)
// parity migrate plan <migration.json>             what it would cost, per screen, and which model does what
// parity migrate prepare <migration.json>          read the records, write the proofs, lay the app out (no model)
// parity migrate prove <migration.json>            prove the screens as they are, update the board (no model)
// parity migrate run <migration.json> --budget 10 --yes [--screens a,b]
//   reads every record through the legacy screens, lays out the app from the modern template, builds each screen
//   with Muse Code and proves it. Nothing is spent without --yes, and the run stops before crossing --budget.
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { loadConfig } from "../src/config";
import { openBrowser } from "../src/drivers";
import { crawl, type Inventory } from "../src/migrate/inventory";
import {
  buildScreen,
  countsOf,
  estimate,
  type Migration,
  MigrationSchema,
  roles,
  type ScreenRun,
  scaffold,
  screenProof,
} from "../src/migrate/migrate";
import { type Entity, readRecords, recordScenarios } from "../src/migrate/records";
import { Ledger } from "../src/models/ledger";
import { type Proof, ProofSchema } from "../src/proof/schema";
import { proveApp } from "../src/rebuild/rebuild";
import { openDb } from "../src/store/db";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    budget: { type: "string" },
    yes: { type: "boolean", default: false },
    screens: { type: "string" },
    explore: { type: "boolean", default: false },
    // Screens already built: prove them, and send only targeted repairs for the differences.
    repair: { type: "boolean", default: false },
  },
});
const [command, file] = positionals;
if (!command || !file || !["inventory", "plan", "prepare", "prove", "run"].includes(command)) {
  console.log(
    "usage: parity migrate inventory|plan|prepare|prove|run <migration.json> [--budget 10 --yes] [--screens a,b]\n" +
      "  inventory, plan, prepare and prove make no model call; run spends only with --yes, and stops before crossing --budget.",
  );
  process.exit(2);
}

const m: Migration = MigrationSchema.parse(JSON.parse(readFileSync(file, "utf8")));
const config = loadConfig();
const runDir = join("runs", m.name);
const appDir = join("generated", m.name, "app");
mkdirSync(runDir, { recursive: true });
const setup = m.setup.filter((s) => s.do !== "check");
const boardFile = join(runDir, "board.json");

async function inventory(): Promise<Inventory> {
  const driver = await openBrowser(config, { url: m.url });
  try {
    const inv = await crawl(driver, { setup, start: m.start, maxScreens: 80 });
    await Bun.write(join(runDir, "inventory.json"), `${JSON.stringify(inv, null, 2)}\n`);
    return inv;
  } finally {
    await driver.close();
  }
}

function printPlan() {
  const e = estimate(m);
  console.log(`\n${m.title}: ${m.screens.length} screens to migrate, up to ${m.maxRepairs} repairs each.\n`);
  console.log("  screen                build    repairs   up to");
  for (const r of e.rows)
    console.log(
      `  ${r.screen.padEnd(20)}  $${r.build.toFixed(2)}    $${r.repairs.toFixed(2)}     $${r.upTo.toFixed(2)}`,
    );
  console.log(`\n  expected about $${e.expected.toFixed(2)}, at most $${e.upTo.toFixed(2)}.`);
  console.log("\nWho does what:");
  for (const r of roles(m, values.explore)) console.log(`  ${r.used ? "x" : " "} ${r.step}: ${r.model}`);
  console.log(`\nRun it with: parity migrate run ${file} --budget ${Math.ceil(e.upTo)} --yes`);
}

if (command === "inventory") {
  const inv = await inventory();
  console.log(`${inv.screens.length} screens, ${inv.skipped.length} links not followed (they change data).`);
  for (const s of inv.screens.filter((x) => x.labels.length > 0))
    console.log(
      `  ${s.path}  ${s.title}  ${s.labels.length} fields${s.selectors.length ? `  lists: ${s.selectors.map((x) => `${x.field} (${x.choices})`).join(", ")}` : ""}`,
    );
  console.log(`Wrote ${join(runDir, "inventory.json")}`);
  process.exit(0);
}

printPlan();
if (command === "plan") process.exit(0);
if (command === "run" && (!values.yes || !values.budget)) {
  console.log("\nNothing spent: migration is opt-in. Add --budget <usd> --yes to run it.");
  process.exit(0);
}
const budgetUsd = Number(values.budget ?? 0);
if (command === "run" && !(budgetUsd > 0)) throw new Error("--budget must be a positive amount in USD");

// 1. Records, through the legacy screens: free, and the only source of data for the rebuild.
const entities: Entity[] = [];
{
  const driver = await openBrowser(config, { url: m.url });
  try {
    for (const e of m.entities) {
      const entity = await readRecords(driver, { ...e, setup });
      entities.push(entity);
      console.log(`read ${entity.records.length} ${e.id} (${entity.fields.length} fields)`);
    }
  } finally {
    await driver.close();
  }
}

// 2. One proof per screen: its records, or the scenarios of its proof file.
const proofs = new Map<string, Proof>();
for (const s of m.screens) {
  if (s.entity) {
    const entity = entities.find((e) => e.id === s.entity);
    if (!entity) throw new Error(`screen ${s.id}: no entity ${s.entity}`);
    const { scenarios, checkpoints } = recordScenarios(entity, m.title);
    proofs.set(
      s.id,
      ProofSchema.parse({
        format: "parity-proof",
        version: 1,
        createdAt: new Date().toISOString(),
        reference: { app: m.title, source: "replay", adapter: { prelude: setup } },
        scenarios,
        checkpoints,
      }),
    );
  } else if (s.proof) proofs.set(s.id, screenProof(s));
  else throw new Error(`screen ${s.id} needs an entity or a proof`);
  await Bun.write(join(runDir, "proofs", `${s.id}.json`), `${JSON.stringify(proofs.get(s.id), null, 2)}\n`);
}
// The whole migration as one proof, for the diff screen and the report.
const all = [...proofs.values()];
const first = all[0] as Proof;
await Bun.write(
  join(runDir, "proof.json"),
  `${JSON.stringify(
    ProofSchema.parse({
      ...first,
      scenarios: all.flatMap((p) => p.scenarios),
      checkpoints: all.flatMap((p) => p.checkpoints),
      volatile: [...new Set(all.flatMap((p) => p.volatile))],
    }),
    null,
    2,
  )}\n`,
);

// 3. The app, laid out from the template with the migrated records.
scaffold(appDir, m, entities);
if (command === "prepare") {
  console.log(`Prepared ${appDir} and ${join(runDir, "proof.json")}: nothing spent.`);
  process.exit(0);
}

// 4. One Muse Code build per screen, proved with its own scenarios.
const ledger = new Ledger(openDb(config.PARITY_DB));
const runId = `migrate-${m.name}`;
const only = values.screens?.split(",").map((x) => x.trim());
const previous = (await Bun.file(boardFile).exists())
  ? ((await Bun.file(boardFile).json()) as { screens?: ScreenRun[]; budgetUsd?: number })
  : {};
const runs = new Map<string, ScreenRun>((previous.screens ?? []).map((r) => [r.screen, r]));
const writeBoard = () =>
  Bun.write(
    boardFile,
    `${JSON.stringify(
      {
        name: m.name,
        title: m.title,
        at: new Date().toISOString(),
        budgetUsd: budgetUsd || previous.budgetUsd || 0,
        spentUsd: ledger.total(runId).costUsd,
        entities: entities.map((e) => ({
          id: e.id,
          path: e.path,
          records: e.records.length,
          fields: e.fields.length,
        })),
        screens: m.screens.map((s) => ({
          title: s.title,
          path: s.path ?? entities.find((e) => e.id === s.entity)?.path,
          ...(runs.get(s.id) ?? {
            screen: s.id,
            state: "skipped",
            scenarios: proofs.get(s.id)?.scenarios.length ?? 0,
          }),
        })),
      },
      null,
      2,
    )}\n`,
  );
await writeBoard();
if (command === "prove") {
  for (const s of m.screens) {
    if (only && !only.includes(s.id)) continue;
    const before = runs.get(s.id);
    const result = await proveApp(config, appDir, proofs.get(s.id) as Proof);
    const r: ScreenRun = {
      screen: s.id,
      costUsd: before?.costUsd ?? 0,
      repairs: before?.repairs ?? 0,
      scenarios: proofs.get(s.id)?.scenarios.length ?? 0,
      ...countsOf(result),
      state: result.equal ? "proved" : "different",
    };
    runs.set(s.id, r);
    console.log(`  ${s.id}: ${r.state}, ${r.fieldsEqual}/${r.fieldsCompared} fields equal`);
  }
  await writeBoard();
  process.exit(0);
}
for (const s of m.screens) {
  if (only && !only.includes(s.id)) continue;
  const from = values.repair ? await proveApp(config, appDir, proofs.get(s.id) as Proof) : undefined;
  if (from?.equal) {
    console.log(`\n${s.id}: already at parity, nothing to repair`);
    continue;
  }
  console.log(`\n${values.repair ? "repairing" : "building"} ${s.id}...`);
  const r = await buildScreen(config, ledger, {
    from,
    m,
    screen: s,
    proof: proofs.get(s.id) as Proof,
    entities,
    appDir,
    runId,
    budgetUsd,
  });
  // A repair adds to what the screen already cost.
  const earlier = values.repair ? runs.get(s.id) : undefined;
  if (earlier) {
    r.costUsd += earlier.costUsd;
    r.repairs += earlier.repairs;
  }
  runs.set(s.id, r);
  await writeBoard();
  console.log(
    `  ${r.state}: ${r.fieldsEqual}/${r.fieldsCompared} fields equal over ${r.scenarios} scenarios, ${r.repairs} repairs, $${r.costUsd.toFixed(3)}${r.error ? `\n  ${r.error}` : ""}`,
  );
}
console.log(
  `\nSpent on this migration: $${ledger.total(runId).costUsd.toFixed(3)} of $${budgetUsd.toFixed(2)}. Board: ${boardFile}`,
);
