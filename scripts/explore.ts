// Let Muse Spark computer use explore a web app and report screens the proof never checked:
// bun run explore <proof.json> --url <app url> [--goal "..."] [--steps 12] [--max-usd 0.5] [--out runs/<name>]
// The proof's steps up to its first check are played first, without the model (logging in, for example).
// [--ack <code>] acknowledges that Meta safety check code on the operator's behalf, for an app on this machine only.
import { mkdirSync } from "node:fs";
import { basename, join } from "node:path";
import { parseArgs } from "node:util";
import { loadConfig } from "../src/config";
import { openBrowser } from "../src/drivers";
import { explore } from "../src/explore/explore";
import { createModels } from "../src/models";
import { Ledger } from "../src/models/ledger";
import { ProofSchema } from "../src/proof/schema";
import { openDb } from "../src/store/db";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    url: { type: "string" },
    goal: { type: "string", default: "find the screens where prices, taxes, discounts and totals are set" },
    steps: { type: "string", default: "12" },
    "max-usd": { type: "string", default: "0.5" },
    out: { type: "string" },
    // Safety check codes acknowledged in advance for a local sandbox, e.g. computer_action_requires_confirmation.
    ack: { type: "string", multiple: true, default: [] },
  },
});
const file = positionals[0];
if (!file || !values.url) {
  console.log(
    "usage: bun run explore <proof.json> --url <app url> [--goal ...] [--steps 12] [--max-usd 0.5]",
  );
  process.exit(1);
}
const proof = ProofSchema.parse(await Bun.file(file).json());
const steps = proof.scenarios[0]?.steps ?? [];
// Only the opening of the app and the login run before the model: everything up to the second `open`.
const second = steps.findIndex((s, i) => i > 0 && s.do === "open");
const firstCheck = steps.findIndex((s) => s.do === "check");
const end = second >= 0 ? second : firstCheck >= 0 ? firstCheck : steps.length;
const login = steps.slice(0, end).filter((s) => s.do !== "check");

const config = loadConfig();
const ledger = new Ledger(openDb(config.PARITY_DB));
const runId = `explore-${basename(file).replace(/\.json$/, "")}`;
const out = values.out ?? join("runs", runId);
mkdirSync(out, { recursive: true });
const origin = new URL(values.url).origin;
const driver = await openBrowser(config, { url: values.url });
try {
  const run = await explore(driver, createModels(config, ledger).computer, {
    setup: login,
    known: proof.checkpoints.map((c) => c.screen),
    goal: values.goal,
    maxSteps: Number(values.steps),
    maxCostUsd: Number(values["max-usd"]),
    runId,
    origin,
    acknowledge: values.ack,
  });
  run.found.forEach((f, i) => {
    Bun.write(join(out, `found-${i + 1}.png`), Buffer.from(f.screenshot.split(",")[1] ?? "", "base64"));
  });
  await Bun.write(
    join(out, "exploration.json"),
    `${JSON.stringify({ ...run, found: run.found.map(({ screenshot: _, ...f }) => f) }, null, 2)}\n`,
  );
  console.log(
    `${run.steps} model steps, ${run.actions} actions, $${run.costUsd.toFixed(3)}, stopped: ${run.stoppedBecause}`,
  );
  if (run.acknowledged.length)
    console.log(`  ${run.acknowledged.length} safety checks acknowledged (--ack), listed in the report`);
  if (run.note) console.log(`  ${run.note.slice(0, 400)}`);
  for (const f of run.found)
    console.log(
      `  new screen at step ${f.step}: ${f.title} (${f.location}) ${f.labels.slice(0, 8).join(", ")}`,
    );
  console.log(`Wrote ${join(out, "exploration.json")}`);
} finally {
  await driver.close();
}
