// Prove a candidate app against a proof and write the one-page report. No model call.
//   bun run report runs/vs3                       (proof, rules and frames of a captured run; app in generated/vs3/app)
//   bun run report runs/vs3 --app <dir> | --url <url>
//   bun run report --proof fixtures/proofs/vs3-invoice.json --fixture [--fixed]   (the one-cent example)
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import type { Capture } from "../src/capture/capture";
import { loadConfig } from "../src/config";
import { coverageOf } from "../src/coverage/coverage";
import { openBrowser } from "../src/drivers";
import { Ledger } from "../src/models/ledger";
import type { DataUrl } from "../src/models/types";
import { ProofSchema } from "../src/proof/schema";
import { startApp } from "../src/rebuild/rebuild";
import { prove } from "../src/replay/prove";
import { renderReport } from "../src/report/report";
import { RuleStore } from "../src/rules/store";
import { openDb } from "../src/store/db";
import { serveFixture } from "./fixture-server";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    proof: { type: "string" },
    app: { type: "string" },
    url: { type: "string" },
    fixture: { type: "boolean", default: false },
    fixed: { type: "boolean", default: false },
    out: { type: "string" },
  },
});

const runDir = positionals[0];
const runId = runDir ? basename(resolve(runDir)) : undefined;
const proofPath = values.proof ?? (runDir ? join(runDir, "proof.json") : undefined);
if (!proofPath) {
  console.log(
    "usage: bun run report <run dir> [--app dir | --url url]  or  --proof file --fixture [--fixed]",
  );
  process.exit(1);
}
const proofBytes = await Bun.file(proofPath).bytes();
const proof = ProofSchema.parse(JSON.parse(new TextDecoder().decode(proofBytes)));

// The candidate: a URL, the fixture, or an app directory served the way rebuilds are.
const appDir = values.app ?? (runId ? join("generated", runId, "app") : undefined);
const fixture = values.fixture ? serveFixture(values.fixed) : null;
const served =
  !values.url && !fixture && appDir && existsSync(appDir) ? await startApp(resolve(appDir)) : null;
const url = values.url ?? (fixture ? `http://127.0.0.1:${fixture.port}/` : served?.url);
if (!url) {
  console.log("No candidate: pass --app, --url or --fixture.");
  process.exit(1);
}
const candidate = (
  values.url ?? (fixture ? `fixture (${values.fixed ? "fixed" : "one rounding"})` : (appDir ?? url))
).replaceAll("\\", "/");

const config = loadConfig();
const db = openDb(config.PARITY_DB);
const ledger = new Ledger(db);
const rebuiltImages: Record<string, DataUrl> = {};
const driver = await openBrowser(config, { url });
let result: Awaited<ReturnType<typeof prove>>;
try {
  result = await prove(proof, driver, {
    onCheck: (c, shot) => {
      rebuiltImages[`${c.scenario}:${c.step}`] = shot;
    },
  });
} finally {
  await driver.close();
  served?.stop();
  fixture?.stop(true);
}

// Reference evidence: the key frames of the recording the checkpoints were read from.
const legacyImages: Record<string, DataUrl> = {};
for (const c of proof.checkpoints) {
  const n = /^frame-(\d+)$/.exec(c.screen.id)?.[1];
  const file = runDir && n ? join(runDir, "frames", `frame-${n.padStart(4, "0")}.png`) : undefined;
  if (file && existsSync(file)) {
    legacyImages[c.screen.id] =
      `data:image/png;base64,${Buffer.from(await Bun.file(file).bytes()).toString("base64")}`;
  }
}

const rules = runId ? new RuleStore(db).list(runId) : [];
const captureFile = runDir ? join(runDir, "capture.json") : undefined;
const coverage =
  captureFile && existsSync(captureFile)
    ? coverageOf(
        (await Bun.file(captureFile).json()) as Capture,
        proof,
        rules.filter((r) => r.status !== "rejected"),
      )
    : undefined;
const ids = runId ? [runId, `rebuild-${runId}`] : [];
const totals = ids.map((id) => ledger.total(id));
const calls = {
  calls: totals.reduce((n, t) => n + t.calls, 0),
  costUsd: totals.reduce((n, t) => n + t.costUsd, 0),
  sentBytes: totals.reduce((n, t) => n + t.sentBytes, 0),
};
const git = Bun.spawnSync(["git", "describe", "--always", "--dirty"], { stdout: "pipe", stderr: "ignore" });

const html = renderReport({
  proof,
  result,
  candidate,
  rules,
  coverage,
  calls,
  legacyImages,
  rebuiltImages,
  proofSha256: createHash("sha256").update(proofBytes).digest("hex"),
  parityVersion: git.success ? git.stdout.toString().trim() : "unknown",
  generatedAt: new Date(),
});
const out = values.out ?? (runDir ? join(runDir, "report.html") : "runs/report.html");
await Bun.write(out, html);
console.log(`${result.equal ? "PARITY" : "NO PARITY"}. Report: ${out}`);
process.exitCode = result.equal ? 0 : 1;
