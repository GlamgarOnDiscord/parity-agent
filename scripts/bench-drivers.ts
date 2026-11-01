// Replay time and flakiness per browser driver: parity bench [--runs 20] [--proof file].
// Each run opens the driver, proves the proof on the one-cent fixture (expected: differences) and on the fixed
// one (expected: parity), then closes. A run is flaky when a verdict is not the expected one or the run throws.
// The driver comes from config (PARITY_BROWSER, PARITY_CDP_URL), as everywhere else (docs/decisions.md D1).
import { parseArgs } from "node:util";
import { loadConfig } from "../src/config";
import { openBrowser } from "../src/drivers";
import { ProofSchema } from "../src/proof/schema";
import { prove } from "../src/replay/prove";
import { serveFixture } from "./fixture-server";

const { values } = parseArgs({
  options: {
    proof: { type: "string", default: "fixtures/proofs/vs3-invoice.json" },
    runs: { type: "string", default: "20" },
    json: { type: "boolean", default: false },
  },
});

const config = loadConfig();
const proof = ProofSchema.parse(await Bun.file(values.proof).json());
const runs = Number(values.runs);
if (!Number.isInteger(runs) || runs < 1) throw new Error("--runs must be a positive integer");

const broken = serveFixture(false);
const fixed = serveFixture(true);
const times: number[] = [];
const failures: string[] = [];

try {
  for (let i = 1; i <= runs; i++) {
    for (const [fixture, expected] of [
      [broken, false],
      [fixed, true],
    ] as const) {
      const started = performance.now();
      try {
        const driver = await openBrowser(config, { url: `http://127.0.0.1:${fixture.port}/` });
        try {
          const result = await prove(proof, driver);
          if (result.equal !== expected)
            failures.push(`run ${i}: ${expected ? "parity" : "difference"} missed`);
        } finally {
          await driver.close();
        }
      } catch (error) {
        failures.push(`run ${i}: ${error instanceof Error ? error.message : String(error)}`);
      }
      times.push(performance.now() - started);
    }
  }
} finally {
  broken.stop(true);
  fixed.stop(true);
}

const sorted = [...times].sort((a, b) => a - b);
// Nearest rank: the median of 40 is the 20th value, p90 the 36th.
const pick = (q: number) => Math.round(sorted[Math.max(0, Math.ceil(q * sorted.length) - 1)] ?? 0);
const summary = {
  driver: config.PARITY_BROWSER,
  proofs: times.length,
  medianMs: pick(0.5),
  p90Ms: pick(0.9),
  minMs: Math.round(sorted[0] ?? 0),
  maxMs: Math.round(sorted.at(-1) ?? 0),
  flaky: failures.length,
  failures,
};

if (values.json) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(
    `${summary.driver}: ${summary.proofs} proofs, median ${summary.medianMs} ms, p90 ${summary.p90Ms} ms ` +
      `(${summary.minMs} to ${summary.maxMs} ms), flaky ${summary.flaky} of ${summary.proofs}`,
  );
  for (const f of failures) console.log(`  ${f}`);
}
process.exitCode = failures.length ? 1 : 0;
