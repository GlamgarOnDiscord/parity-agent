// Record a web app as the reference of a proof by replaying a scenario on it, and measure its noise:
// bun run record:reference <scenario.json> --url http://127.0.0.1:8080/ [--runs 3] [--out proof.json]
// No model call: replays and field reading are local.
import { parseArgs } from "node:util";
import { loadConfig } from "../src/config";
import { detectVolatile } from "../src/diff/volatile";
import { openBrowser } from "../src/drivers";
import { AdapterSchema, type Checkpoint, type Proof, ProofSchema, ScenarioSchema } from "../src/proof/schema";
import { replay } from "../src/replay/replay";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    url: { type: "string" },
    runs: { type: "string", default: "3" },
    out: { type: "string" },
    app: { type: "string", default: "reference" },
  },
});
const file = positionals[0];
if (!file || !values.url) {
  console.log(
    "usage: bun run record:reference <scenario.json> --url <app url> [--runs 3] [--out proof.json]",
  );
  process.exit(1);
}
const runs = Math.max(2, Number(values.runs));
// A scenario file may carry how the reference app reaches the screen (login, its own paths): `reference.adapter`.
const raw = await Bun.file(file).json();
const scenario = ScenarioSchema.parse(raw);
const adapter = raw.reference?.adapter ? AdapterSchema.parse(raw.reference.adapter) : undefined;
const driver = await openBrowser(loadConfig(), { url: values.url });

const results: Checkpoint[][] = [];
const times: number[] = [];
try {
  for (let i = 0; i < runs; i++) {
    const started = performance.now();
    results.push(await replay(driver, scenario, undefined, adapter));
    times.push(Math.round(performance.now() - started));
  }
} finally {
  await driver.close();
}

// A field is noise if it differs between any two runs of the same app.
const first = results[0] ?? [];
const volatile = [
  ...new Set(
    results.slice(1).flatMap((other) =>
      detectVolatile(
        first.map((c) => c.screen),
        other.map((c) => c.screen),
      ),
    ),
  ),
].sort();

const proof: Proof = ProofSchema.parse({
  format: "parity-proof",
  version: 1,
  createdAt: new Date().toISOString(),
  reference: { app: values.app, source: "replay", adapter },
  scenarios: [scenario],
  checkpoints: first,
  volatile,
});
const out = values.out ?? file.replace(/\.json$/, ".proof.json");
await Bun.write(out, `${JSON.stringify(proof, null, 2)}\n`);

const fields = first.reduce((n, c) => n + c.screen.fields.length, 0);
const sorted = [...times].sort((a, b) => a - b);
console.log(`${scenario.name}: ${runs} runs, ${first.length} checkpoints, ${fields} fields read`);
console.log(`Run time: median ${sorted[Math.floor(sorted.length / 2)]} ms (${times.join(", ")} ms)`);
console.log(
  `Noise: ${volatile.length} of ${fields} fields change between runs: ${volatile.join(", ") || "none"}`,
);
console.log(`Wrote ${out}`);
