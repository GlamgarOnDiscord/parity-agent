import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { z } from "zod";
import { type Config, requireKey } from "../config";
import type { Ledger } from "../models/ledger";
import { runMuseCode } from "../models/muse-code";
import { code } from "../models/prompt-text";
import { type Proof, ProofSchema, StepSchema } from "../proof/schema";
import { proveApp, repairPrompt } from "../rebuild/rebuild";
import type { ProveResult } from "../replay/prove";
import { dataFile, type Entity } from "./records";

const Id = z.string().regex(/^[a-z0-9-]{1,40}$/);
const Path = z.string().regex(/^\/(?![/\\])[^\\]*$/);

/** What the operator migrates: where the legacy app is, its records, and the screens to rebuild. */
export const MigrationSchema = z.object({
  name: Id,
  title: z.string().max(80),
  url: z.url(),
  /** Steps that reach the app (login), played before every read on the legacy side only. */
  setup: z.array(StepSchema).max(20).default([]),
  /** Where the inventory crawl starts. */
  start: z.array(Path).min(1).max(20),
  entities: z
    .array(
      z.object({
        id: Id,
        path: Path,
        selector: z.string().max(120),
        param: z.string().max(40).optional(),
        max: z.number().int().min(1).max(500).optional(),
      }),
    )
    .max(20),
  screens: z
    .array(
      z.object({
        id: Id,
        title: z.string().max(80),
        menu: z.string().max(40).optional(),
        /** A form that shows one record of this entity: its scenarios are the records themselves. */
        entity: Id.optional(),
        /** Otherwise the legacy address, and a proof whose scenarios this screen must pass. */
        path: Path.optional(),
        proof: z.string().max(200).optional(),
        /** Entities the screen reads (an invoice reads items and prices). */
        uses: z.array(Id).max(10).default([]),
        /** A file to port, for example a screen rebuilt earlier with a catalogue in its code. */
        port: z.string().max(200).optional(),
      }),
    )
    .max(100)
    // Empty while the app is only being inventoried: screens are picked from what the crawl found.
    .default([]),
  maxRepairs: z.number().int().min(0).max(5).default(2),
  maxSteps: z.number().int().min(4).max(40).default(16),
  /** The visual direction of the rebuilt app (DESIGN.md); chosen from the app's domain when left out. */
  direction: z.enum(["ledger", "paper", "counting-house", "signal", "atelier", "night-shift"]).optional(),
});
export type Migration = z.infer<typeof MigrationSchema>;
export type Direction = NonNullable<Migration["direction"]>;

/**
 * The direction a rebuilt app takes when the migration does not name one: from the words of its title, screens and
 * entities, so two apps of different domains do not come out with the same look. Plain code, same answer every run.
 */
export function directionFor(m: Migration): Direction {
  if (m.direction) return m.direction;
  const words = [
    m.title,
    ...m.screens.flatMap((s) => [s.id, s.title, s.menu ?? ""]),
    ...m.entities.map((e) => e.id),
  ]
    .join(" ")
    .toLowerCase();
  const by: [Direction, RegExp][] = [
    [
      "counting-house",
      /invoic|account|ledger|bill|payment|tax|quote|order|supplier|stock|inventory|erp|bank/,
    ],
    ["paper", /crm|contact|client|customer|lead|deal|hr|employee|candidate|doc|note|member/],
    ["ledger", /monitor|server|log|ticket|incident|ops|shipment|fleet|sensor|metric/],
    ["atelier", /booking|class|course|student|lesson|appointment|event|shop/],
  ];
  return by.find(([, re]) => re.test(words))?.[0] ?? "signal";
}
export type MigrationScreen = Migration["screens"][number];

/**
 * Prices from the runs logged so far (docs/benchmarks.md): a first build of one screen with Muse Code, and one
 * targeted repair. Shown before anything is spent, and the run stops at the budget given.
 */
export const COST = { build: 1.0, repair: 0.45 } as const;

export interface Estimate {
  rows: { screen: string; build: number; repairs: number; upTo: number }[];
  expected: number;
  upTo: number;
}

export function estimate(m: Migration): Estimate {
  const rows = m.screens.map((s) => {
    const repairs = m.maxRepairs * COST.repair;
    return { screen: s.id, build: COST.build, repairs, upTo: COST.build + repairs };
  });
  return {
    rows,
    expected: rows.reduce((n, r) => n + r.build + COST.repair, 0),
    upTo: rows.reduce((n, r) => n + r.upTo, 0),
  };
}

/** The Meta model behind each step of a migration, and whether this migration uses it. */
export function roles(m: Migration, explore: boolean): { step: string; model: string; used: boolean }[] {
  return [
    { step: "inventory and records, read from the legacy screens", model: "none (plain code)", used: true },
    { step: "screens no link reaches", model: "Muse Spark computer use", used: explore },
    { step: "one build per screen, then targeted repairs", model: "Muse Code (muse-spark-1.3)", used: true },
    { step: "every comparison", model: "none (plain code)", used: true },
    {
      step: "rules from a narrated recording",
      model: "Muse Spark, Muse Wonder, voice transcription",
      used: false,
    },
    { step: "fields on desktop frames", model: "SAM", used: false },
    { step: "extraction on premises", model: "Muse Spark Open", used: false },
  ].map((r) => ({ ...r, used: r.used && m.screens.length > 0 }));
}

const TEMPLATE = resolve("templates/migrated-app");
/** Files of the template a build may not change: restored after every Muse Code run. */
const FIXED = [
  "public/app.js",
  "public/index.html",
  "public/style.css",
  "public/fonts/Geist-Variable.woff2",
  "public/fonts/GeistMono-Variable.woff2",
  "CONTRACT.md",
  // The design skill Muse Code reads before a screen: the rules, and two screens that apply them.
  "DESIGN.md",
  "reference/design/record.js",
  "reference/design/document.js",
];

/**
 * Write a file of the app without following anything Muse Code may have put in its place: every directory on the
 * way must be a real directory, and whatever sits at the path (a symbolic link, a hard link, a folder) is removed
 * first, so the write can only create a new file inside the app.
 */
function put(appDir: string, rel: string, content: string | Uint8Array): void {
  const root = resolve(appDir);
  const dest = resolve(root, rel);
  if (!dest.startsWith(root + sep)) throw new Error(`refusing to write outside the app: ${rel}`);
  let dir = root;
  for (const part of relative(root, dirname(dest)).split(sep).filter(Boolean)) {
    dir = join(dir, part);
    if (!existsSync(dir)) mkdirSync(dir);
    else if (!lstatSync(dir).isDirectory()) throw new Error(`${relative(root, dir)} is not a real directory`);
  }
  rmSync(dest, { force: true, recursive: true });
  writeFileSync(dest, content, { flag: "wx" });
}

/** Lay the app out from the template: the shell, the kit, the list of screens, and the migrated records. */
export function scaffold(appDir: string, m: Migration, entities: Entity[]): void {
  mkdirSync(appDir, { recursive: true });
  restoreFixed(appDir, m);
  put(appDir, "server.ts", readFileSync(join(TEMPLATE, "server.ts"), "utf8"));
  const byId = new Map(entities.map((e) => [e.id, e]));
  const screens = m.screens.map((s) => ({
    id: s.id,
    title: s.title,
    menu: s.menu,
    path: s.path ?? byId.get(s.entity ?? "")?.path ?? `/${s.id}`,
  }));
  put(appDir, "public/screens.json", `${JSON.stringify(screens, null, 2)}\n`);
  for (const e of entities) put(appDir, `data/${e.id}.json`, `${JSON.stringify(dataFile(e), null, 2)}\n`);
  for (const s of m.screens) {
    if (!existsSync(join(appDir, "public", "screens", `${s.id}.js`)))
      put(
        appDir,
        `public/screens/${s.id}.js`,
        `// Muse Code fills this screen.\nexport async function render(root, kit) {\n  root.append(kit.ui.empty("Not migrated yet."));\n}\n`,
      );
  }
  put(
    appDir,
    "migration.json",
    `${JSON.stringify({ name: m.name, title: m.title, direction: directionFor(m), screens }, null, 2)}\n`,
  );
}

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/**
 * Put the template's fixed files back, read from the template only, with the app's name in the shell: whatever a
 * build did to them, links included, is replaced.
 */
function restoreFixed(appDir: string, m: Migration) {
  const title = m.title;
  for (const f of FIXED) {
    if (f !== "public/index.html") {
      put(appDir, f, readFileSync(join(TEMPLATE, f)));
      continue;
    }
    const html = readFileSync(join(TEMPLATE, f), "utf8")
      .replace('<html lang="en">', `<html lang="en" data-direction="${directionFor(m)}">`)
      .replace("<title>Rebuilt app</title>", `<title>${escapeHtml(title)}</title>`)
      .replace('<span id="app-name">Rebuilt app</span>', `<span id="app-name">${escapeHtml(title)}</span>`);
    put(appDir, f, html);
  }
}

/** The labels a screen shows, in order, with values from a few records: what the build has to reproduce. */
function sampleOf(proof: Proof, max = 2): string {
  return proof.checkpoints
    .slice(0, max)
    .map((c) => {
      const scenario = proof.scenarios.find((s) => s.id === c.scenario);
      const how = scenario?.steps
        .filter((s) => s.do !== "check")
        .map((s) =>
          s.do === "open"
            ? `open ${s.path}`
            : s.do === "fill"
              ? `${s.field} = ${s.value}`
              : `click ${s.target}`,
        )
        .map(code)
        .join("; ");
      const fields = c.screen.fields
        .map((f) => `  - ${code(f.label)}${f.group ? ` (line ${code(f.group)})` : ""}: ${code(f.value)}`)
        .join("\n");
      return `After: ${how}\n${fields}`;
    })
    .join("\n\n");
}

export function buildPrompt(m: Migration, screen: MigrationScreen, proof: Proof, entities: Entity[]): string {
  const uses = [...new Set([...(screen.entity ? [screen.entity] : []), ...screen.uses])];
  const data = uses
    .map((id) => {
      const e = entities.find((x) => x.id === id);
      return e
        ? `- ${code(id)}: ${e.records.length} records in data/${id}.json, picked by ${code(e.selector)}; fields: ${e.fields.slice(0, 30).map(code).join(", ")}`
        : "";
    })
    .filter(Boolean)
    .join("\n");
  const entity = entities.find((e) => e.id === screen.entity);
  const lines = [
    `You are migrating one screen of ${m.title} into the modern app in this folder. Read CONTRACT.md, DESIGN.md and the two reference screens in reference/design/, then the kit in public/app.js. Write only public/screens/${screen.id}.js. This app's direction is "${directionFor(m)}": the shell already applies its colors and sizes; follow its notes in DESIGN.md.`,
    "",
    `Screen ${code(screen.id)}: ${code(screen.title)}.`,
    entity
      ? `It shows one record of ${code(entity.id)} at a time, picked with the list ${code(entity.selector)} whose choices are the records' keys${
          entity.param ? `; the address may carry ?${entity.param}=<value>, which opens that record` : ""
        }. Picking a record shows its fields, read from the data, never from code.`
      : `Legacy address: ${code(screen.path ?? "")}.`,
    "",
    "Migrated data available to this screen:",
    data || "- none",
    "",
    "What the legacy screen shows, field by field, labels exactly as written:",
    sampleOf(proof),
    "",
    "Values `true`/`false` are check boxes. Fields marked with a line are rows of a table. Follow DESIGN.md: group the",
    "fields by meaning in a few titled cards, key figures first, every label and value exactly as above.",
  ];
  if (screen.port) {
    lines.push(
      "",
      `Port the logic of ${code(screen.port)} (copied next to this screen as reference/${screen.id}.js): its computations,`,
      "rounding and labels are proven. Replace any catalogue, price or description written in it by the migrated data.",
    );
  }
  return lines.join("\n");
}

export interface ScreenRun {
  screen: string;
  state: "built" | "proved" | "different" | "failed" | "skipped";
  costUsd: number;
  repairs: number;
  fieldsEqual: number;
  fieldsCompared: number;
  different: number;
  missing: number;
  scenarios: number;
  error?: string;
}

export function countsOf(r: ProveResult) {
  let equal = 0;
  let compared = 0;
  let different = 0;
  let missing = 0;
  for (const c of r.checkpoints) {
    equal += c.diff.counts.equal;
    different += c.diff.counts.different;
    missing += c.diff.counts.missing;
    compared +=
      c.diff.counts.equal +
      c.diff.counts.different +
      c.diff.counts.masked +
      c.diff.counts.missing +
      (c.diff.counts.accepted ?? 0);
  }
  return { fieldsEqual: equal, fieldsCompared: compared, different, missing };
}

/**
 * Build one screen with Muse Code, prove it with its scenarios, and send targeted repairs until it passes, the
 * repairs run out, or the budget for this migration would be crossed.
 */
export async function buildScreen(
  config: Config,
  ledger: Ledger,
  options: {
    m: Migration;
    screen: MigrationScreen;
    proof: Proof;
    entities: Entity[];
    appDir: string;
    runId: string;
    budgetUsd: number;
    /** The screen is already built: start from the differences of this proof, with repairs only. */
    from?: ProveResult;
  },
): Promise<ScreenRun> {
  const { m, screen, proof, appDir, runId } = options;
  const apiKey = requireKey(config.MODEL_API_KEY, "MODEL_API_KEY");
  const run: ScreenRun = {
    screen: screen.id,
    state: "skipped",
    costUsd: 0,
    repairs: 0,
    fieldsEqual: 0,
    fieldsCompared: 0,
    different: 0,
    missing: 0,
    scenarios: proof.scenarios.length,
  };
  if (screen.port && existsSync(screen.port)) {
    put(appDir, `reference/${screen.id}.js`, readFileSync(screen.port, "utf8"));
  }
  const repairOnly = options.from && !options.from.equal;
  let prompt = repairOnly
    ? `${repairPrompt(options.from as ProveResult, proof)}\n\nEdit only public/screens/${screen.id}.js; the data in data/ is the legacy app's, keep reading from it.`
    : buildPrompt(m, screen, proof, options.entities);
  for (let n = repairOnly ? 1 : 0; n <= m.maxRepairs; n++) {
    const next = n === 0 ? COST.build : COST.repair;
    if (ledger.total(runId).costUsd + next > options.budgetUsd) {
      run.error = `stopped before ${n === 0 ? "the build" : `repair ${n}`}: the migration budget of $${options.budgetUsd.toFixed(2)} would be crossed`;
      return run;
    }
    const muse = await runMuseCode(
      {
        apiKey,
        model: config.PARITY_MODEL_STRUCTURED,
        workspace: appDir,
        prompt,
        maxSteps: m.maxSteps,
        runId,
        eventsFile: join(appDir, "..", `muse-${screen.id}-${n}.jsonl`),
      },
      ledger,
    );
    run.costUsd += muse.costUsd;
    if (n > 0) run.repairs = n;
    restoreFixed(appDir, m);
    if (!muse.ok) {
      run.state = "failed";
      run.error = `Muse Code exited with ${muse.exitCode}: ${muse.stderr.slice(-300)}`;
      return run;
    }
    run.state = "built";
    let result: ProveResult;
    try {
      result = await proveApp(config, appDir, proof);
    } catch (error) {
      run.error = String(error).slice(0, 300);
      prompt = `Replaying the legacy scenarios on public/screens/${screen.id}.js failed: ${run.error}. Fix that file so it follows CONTRACT.md.`;
      continue;
    }
    Object.assign(run, countsOf(result));
    run.error = undefined;
    if (result.equal) {
      run.state = "proved";
      return run;
    }
    run.state = "different";
    prompt = `${repairPrompt(result, proof)}\n\nEdit only public/screens/${screen.id}.js; the data in data/ is the legacy app's, keep reading from it.`;
  }
  return run;
}

/** The proof of a screen bound to a proof file: its scenarios open the legacy address on both apps. */
export function screenProof(screen: MigrationScreen): Proof {
  const proof = ProofSchema.parse(JSON.parse(readFileSync(screen.proof as string, "utf8")));
  const paths = proof.reference.adapter?.paths ?? {};
  // A migrated app answers the legacy addresses itself: what the adapter mapped for the reference is now the path.
  const scenarios = proof.scenarios.map((s) => ({
    ...s,
    steps: s.steps.map((st) =>
      st.do === "open" && paths[st.path] ? { ...st, path: paths[st.path] as string } : st,
    ),
  }));
  return ProofSchema.parse({
    ...proof,
    scenarios,
    reference: {
      ...proof.reference,
      adapter: proof.reference.adapter ? { ...proof.reference.adapter, paths: {} } : undefined,
    },
  });
}
