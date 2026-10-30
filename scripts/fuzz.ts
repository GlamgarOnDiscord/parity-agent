// Differential fuzzing of a rebuilt app against the live reference:
// parity fuzz <spec.json> --proof <proof.json> --reference-url <url> (--app <dir> | --url <url>)
//   [--seed 1] [--count 30] [--save] [--examples] [--repair --rounds 3 --steps 12]
// Fuzzing and shrinking make no model call. --save adds each difference to the proof as a scenario; --repair
// then sends the proof to Muse Code and fuzzes again with the same seed, until the cases pass or the rounds end.
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { loadConfig } from "../src/config";
import { openBrowser } from "../src/drivers";
import type { AppDriver } from "../src/drivers/types";
import { describeCase, FuzzSpecSchema } from "../src/fuzz/case";
import { addFailures, examplesAround, type FuzzReport, fuzz } from "../src/fuzz/fuzz";
import { Ledger } from "../src/models/ledger";
import { ProofSchema } from "../src/proof/schema";
import { appendHistory } from "../src/rebuild/history";
import { rebuild, startApp } from "../src/rebuild/rebuild";
import { openDb } from "../src/store/db";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    proof: { type: "string" },
    "reference-url": { type: "string" },
    app: { type: "string" },
    url: { type: "string" },
    seed: { type: "string", default: "1" },
    count: { type: "string", default: "30" },
    failures: { type: "string", default: "3" },
    save: { type: "boolean", default: false },
    repair: { type: "boolean", default: false },
    examples: { type: "boolean", default: false },
    rounds: { type: "string", default: "3" },
    steps: { type: "string", default: "12" },
    json: { type: "string" },
  },
});
const specFile = positionals[0];
if (!specFile || !values.proof || !values["reference-url"] || !(values.app || values.url)) {
  console.log(
    "usage: parity fuzz <spec.json> --proof <proof.json> --reference-url <url> (--app <dir> | --url <url>)\n" +
      "         [--seed 1] [--count 30] [--failures 3] [--save] [--repair --rounds 3 --steps 12] [--json out.json]",
  );
  process.exit(2);
}
if (values.repair && !values.app) {
  console.log("--repair needs --app: Muse Code edits an app folder.");
  process.exit(2);
}

const config = loadConfig();
const spec = FuzzSpecSchema.parse(await Bun.file(specFile).json());
let proof = ProofSchema.parse(await Bun.file(values.proof).json());
const adapter = spec.reference?.adapter ?? proof.reference.adapter;
const seed = Number(values.seed);
const count = Number(values.count);

async function fuzzOnce(): Promise<{ report: FuzzReport; examples: string }> {
  const served = values.app ? await startApp(resolve(values.app)) : null;
  const reference = await openBrowser(config, { url: values["reference-url"] as string });
  let candidate: AppDriver | undefined;
  try {
    candidate = await openBrowser(config, { url: values.url ?? (served?.url as string) });
    const sides = { reference, candidate, adapter, volatile: proof.volatile };
    const report = await fuzz(sides, spec, {
      seed,
      count,
      maxFailures: Number(values.failures),
      onCase: (i, c, r) => {
        const mark = !r ? "!" : r.differs ? "x" : ".";
        process.stdout.write(mark);
        if ((i + 1) % 50 === 0) process.stdout.write("\n");
        if (r?.differs)
          process.stdout.write(`\n  case ${i}: ${describeCase(spec, c)}\n    ${r.signature.join(", ")}\n`);
      },
    });
    // Only when a repair follows: the table costs a few more replays, no model call.
    const tables = [];
    if (values.repair || values.examples)
      for (const f of report.failures) tables.push(await examplesAround(sides, spec, f));
    return { report, examples: tables.filter(Boolean).join("\n\n") };
  } finally {
    await candidate?.close();
    await reference.close();
    served?.stop();
  }
}

function print(report: FuzzReport) {
  console.log(
    `\n\nSeed ${report.seed}: ${report.played} cases played on both apps, ${report.rejected} refused by the reference.`,
  );
  if (report.failures.length === 0) {
    console.log("PARITY on every case.");
    return;
  }
  for (const f of report.failures) {
    console.log(`\nDifference, case ${f.index}, shrunk in ${f.shrinkRuns} runs`);
    console.log(`  from: ${describeCase(spec, f.original)}`);
    console.log(`  to:   ${describeCase(spec, f.case)}`);
    if (f.result.error) console.log(`  the candidate could not play it: ${f.result.error}`);
    for (const d of f.result.diffs) {
      for (const x of d.fields.filter((x) => x.verdict === "different")) {
        const at = x.legacy.group ? ` (${x.legacy.group})` : "";
        console.log(`  ✗ ${x.legacy.label}${at}: ${x.legacy.value}  |  ${x.rebuilt.value}`);
      }
      for (const m of d.missingInRebuilt) console.log(`  ? ${m.label}: ${m.value} (not on the candidate)`);
    }
  }
}

const rounds = values.repair ? Math.max(1, Number(values.rounds)) : 1;
const ledger = values.repair ? new Ledger(openDb(config.PARITY_DB)) : null;
let report: FuzzReport | undefined;
for (let round = 1; round <= rounds; round++) {
  if (rounds > 1) console.log(`\nRound ${round}: ${count} cases, seed ${seed}`);
  const once = await fuzzOnce();
  report = once.report;
  print(report);
  if (once.examples) console.log(`\n${once.examples}`);
  if (values.json) await Bun.write(values.json, `${JSON.stringify(report, null, 2)}\n`);
  if (report.failures.length === 0) break;

  if (values.save || values.repair) {
    const next = addFailures(proof, spec, report);
    proof = ProofSchema.parse(next.proof);
    await Bun.write(values.proof, `${JSON.stringify(proof, null, 2)}\n`);
    console.log(`\nAdded to ${values.proof}: ${next.added.join(", ") || "nothing new"}`);
  }
  if (!ledger || !values.app || round === rounds) break;

  // The spec the app was built from stays the same; the proof now carries the cases that fuzzing found.
  const appDir = resolve(values.app);
  const result = await rebuild(config, ledger, {
    proof,
    spec: readFileSync(join(appDir, "SPEC.md"), "utf8"),
    appDir,
    runId: `fuzz-${spec.id}`,
    maxIterations: 1,
    maxSteps: Number(values.steps),
    examples: once.examples || undefined,
  });
  await appendHistory(join(dirname(values.proof), "history.json"), result.iterations, "fuzz");
  for (const it of result.iterations) {
    const state = it.error
      ? `error: ${it.error.slice(0, 160)}`
      : it.equal
        ? "PARITY"
        : `${it.different} different`;
    console.log(`  repair ${it.n}: $${it.costUsd.toFixed(3)}  ${state}`);
  }
}
if (ledger) {
  const spent = ledger.total(`fuzz-${spec.id}`);
  console.log(`\nRepairs: ${spent.calls} model runs, $${spent.costUsd.toFixed(3)}.`);
}
process.exitCode = report && report.failures.length === 0 ? 0 : 1;
