// Write a Playwright test file from a proof: bun run export:playwright [run] (defaults to runs/vs3). No model call.
import { join } from "node:path";
import { playwrightSpec } from "../src/export/playwright";
import { ProofSchema } from "../src/proof/schema";

const run = process.argv[2] ?? "runs/vs3";
const proof = ProofSchema.parse(await Bun.file(join(run, "proof.json")).json());
const out = join(run, "parity.spec.ts");
await Bun.write(out, playwrightSpec(proof));
console.log(`wrote ${out} (${proof.scenarios.length} scenarios, ${proof.checkpoints.length} checkpoints)`);
