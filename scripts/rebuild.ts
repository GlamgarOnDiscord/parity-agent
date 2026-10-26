// Rebuild an app from a capture with Muse Code and prove it: bun run rebuild [run] [--all-rules] [--max 3]
import { basename, join } from "node:path";
import { parseArgs } from "node:util";
import type { Capture } from "../src/capture/capture";
import { proofFromCapture } from "../src/capture/scenario";
import { loadConfig } from "../src/config";
import { createModels } from "../src/models";
import { Ledger } from "../src/models/ledger";
import { ProofSchema } from "../src/proof/schema";
import { rebuild } from "../src/rebuild/rebuild";
import { writeSpec } from "../src/rebuild/spec";
import { RuleStore } from "../src/rules/store";
import { openDb } from "../src/store/db";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    "all-rules": { type: "boolean", default: false },
    max: { type: "string", default: "3" },
    steps: { type: "string", default: "40" },
  },
});
const runDir = positionals[0] ?? "runs/recording";
const runId = basename(runDir);
const config = loadConfig();
const db = openDb(config.PARITY_DB);
const ledger = new Ledger(db);
const capture = (await Bun.file(join(runDir, "capture.json")).json()) as Capture;

const proofFile = Bun.file(join(runDir, "proof.json"));
const proof = (await proofFile.exists())
  ? ProofSchema.parse(await proofFile.json())
  : await proofFromCapture(capture, createModels(config, ledger), {
      id: runId,
      name: `Scenario from ${runId}`,
      app: "legacy (captured)",
      runId,
    });
await Bun.write(join(runDir, "proof.json"), JSON.stringify(proof, null, 2));

const stored = new RuleStore(db).list(runId);
const rules = values["all-rules"]
  ? stored.filter((r) => r.status !== "rejected")
  : stored.filter((r) => r.status === "accepted");
if (rules.length === 0) {
  console.log(
    "No accepted rules for this run. Review them first, or pass --all-rules to use every rule not rejected.",
  );
  process.exit(1);
}
const spec = writeSpec(capture, proof, rules);
console.log(`Rebuilding ${runId} from ${rules.length} rules, up to ${values.max} iterations`);

const result = await rebuild(config, ledger, {
  proof,
  spec,
  appDir: join("generated", runId, "app"),
  runId: `rebuild-${runId}`,
  maxIterations: Number(values.max),
  maxSteps: Number(values.steps),
});
for (const it of result.iterations) {
  const state = it.error
    ? `error: ${it.error.slice(0, 160)}`
    : it.equal
      ? "PARITY"
      : `${it.different} different, ${it.missing} missing`;
  console.log(`  ${it.n}. ${it.kind.padEnd(6)} $${it.costUsd.toFixed(3)}  ${state}`);
}
for (const c of result.final?.checkpoints ?? []) {
  for (const f of c.diff.fields) {
    const mark = f.verdict === "equal" ? "=" : f.verdict === "masked" ? "~" : "✗";
    console.log(`    ${mark} ${f.legacy.label}: ${f.legacy.value}  |  ${f.rebuilt.value}`);
  }
}
const total = ledger.total(`rebuild-${runId}`);
console.log(`\nApp in ${result.appDir}. ${total.calls} model runs, $${total.costUsd.toFixed(3)}.`);
process.exitCode = result.final?.equal ? 0 : 1;
