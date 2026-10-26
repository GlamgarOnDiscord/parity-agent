// Replay a proof on a candidate app and print every field: bun run prove [--proof file] [--url url | --fixed]
import { parseArgs } from "node:util";
import { loadConfig } from "../src/config";
import { openBrowser } from "../src/drivers";
import { ProofSchema } from "../src/proof/schema";
import { prove } from "../src/replay/prove";
import { serveFixture } from "./fixture-server";

const { values } = parseArgs({
  options: {
    proof: { type: "string", default: "fixtures/proofs/vs3-invoice.json" },
    url: { type: "string" },
    fixed: { type: "boolean", default: false },
    json: { type: "boolean", default: false },
  },
});

const proof = ProofSchema.parse(await Bun.file(values.proof).json());
const fixture = values.url ? null : serveFixture(values.fixed);
const url = values.url ?? `http://127.0.0.1:${fixture?.port}/`;
const driver = await openBrowser(loadConfig(), { url });
const started = performance.now();

try {
  const result = await prove(proof, driver);
  if (values.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    const ms = Math.round(performance.now() - started);
    console.log(`\nReference: ${proof.reference.app}   Candidate: ${url}   (${ms} ms, 2 runs each)`);
    console.log(`Volatile, masked: ${result.volatile.join(", ") || "none"}\n`);
    for (const c of result.checkpoints) {
      console.log(`${c.scenario} › ${c.screen} (step ${c.step})`);
      for (const f of c.diff.fields) {
        const mark = f.verdict === "equal" ? "  =" : f.verdict === "masked" ? "  ~" : "  ✗";
        const left = `${f.legacy.label}: ${f.legacy.value}`.padEnd(30);
        console.log(`${mark} ${left} ${f.rebuilt.label}: ${f.rebuilt.value}`);
      }
      for (const f of c.diff.missingInRebuilt) console.log(`  ? ${f.label}: ${f.value} (no counterpart)`);
      for (const f of c.diff.extraInRebuilt) console.log(`  + ${f.label}: ${f.value} (only in candidate)`);
      const n = c.diff.counts;
      console.log(`  ${n.equal} equal, ${n.different} different, ${n.masked} masked, ${n.missing} missing\n`);
    }
    console.log(result.equal ? "PARITY: every field matches." : "NO PARITY: differences above.");
  }
  process.exitCode = result.equal ? 0 : 1;
} finally {
  await driver.close();
  fixture?.stop(true);
}
