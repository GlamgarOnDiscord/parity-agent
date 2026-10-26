import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Config } from "../config";
import { requireKey } from "../config";
import { openBrowser } from "../drivers";
import type { Ledger } from "../models/ledger";
import { runMuseCode } from "../models/muse-code";
import type { Proof } from "../proof/schema";
import { type ProveResult, prove } from "../replay/prove";

export interface Iteration {
  n: number;
  kind: "build" | "repair";
  costUsd: number;
  equal: boolean;
  different: number;
  missing: number;
  error?: string;
}

export interface RebuildResult {
  appDir: string;
  iterations: Iteration[];
  final?: ProveResult;
}

const TEMPLATE = resolve("templates/generated-app");

/** Start the generated app with its server restored from the template, so generated code never runs on the host. */
async function startApp(appDir: string): Promise<{ url: string; stop: () => void }> {
  cpSync(join(TEMPLATE, "server.ts"), join(appDir, "server.ts"));
  // The running Bun binary: a `bun` shim on PATH would leave the real server behind when stopped.
  const proc = Bun.spawn([process.execPath, join(appDir, "server.ts")], {
    env: { PATH: process.env.PATH ?? "", PORT: "0" },
    stdout: "pipe",
    stderr: "pipe",
  });
  const reader = proc.stdout.getReader();
  let out = "";
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const { value, done } = await reader.read();
    if (done) break;
    out += new TextDecoder().decode(value);
    const m = /listening on (http:\/\/127\.0\.0\.1:\d+)/.exec(out);
    if (m?.[1]) {
      reader.releaseLock();
      return { url: `${m[1]}/`, stop: () => proc.kill() };
    }
  }
  proc.kill();
  throw new Error(`the generated app did not start: ${out.slice(-300)}`);
}

const counts = (r: ProveResult) => ({
  different: r.checkpoints.reduce((s, c) => s + c.diff.counts.different, 0),
  missing: r.checkpoints.reduce((s, c) => s + c.diff.counts.missing, 0),
});

async function proveApp(config: Config, appDir: string, proof: Proof): Promise<ProveResult> {
  const app = await startApp(appDir);
  try {
    const driver = await openBrowser(config, { url: app.url });
    try {
      return await prove(proof, driver);
    } finally {
      await driver.close();
    }
  } finally {
    app.stop();
  }
}

function repairPrompt(result: ProveResult): string {
  const lines = [
    "The rebuilt app does not match the legacy app yet. Parity replayed the scenario from SPEC.md and compared",
    "every field in plain code. Fix public/ so every field below matches exactly; keep CONTRACT.md.",
    "",
  ];
  for (const c of result.checkpoints) {
    for (const f of c.diff.fields.filter((x) => x.verdict === "different")) {
      lines.push(
        `- \`${f.legacy.label}\`: the legacy app shows \`${f.legacy.value}\`, the rebuilt app shows \`${f.rebuilt.value}\``,
      );
    }
    for (const f of c.diff.missingInRebuilt) {
      lines.push(
        `- \`${f.label}\` (legacy value \`${f.value}\`) was not found on the rebuilt screen: check its label`,
      );
    }
  }
  lines.push(
    "",
    "Re-read the business rules and their formulas in SPEC.md, especially where rounding happens.",
  );
  return lines.join("\n");
}

/**
 * Build the app with Muse Code from SPEC.md, prove it against the captured reference, and send every difference
 * back with its evidence until the proof passes or `maxIterations` is reached.
 */
export async function rebuild(
  config: Config,
  ledger: Ledger,
  options: {
    proof: Proof;
    spec: string;
    appDir: string;
    runId: string;
    maxIterations?: number;
    maxSteps?: number;
  },
): Promise<RebuildResult> {
  const apiKey = requireKey(config.MODEL_API_KEY, "MODEL_API_KEY");
  const appDir = resolve(options.appDir);
  if (!existsSync(appDir)) {
    mkdirSync(appDir, { recursive: true });
    cpSync(TEMPLATE, appDir, { recursive: true });
  }
  await Bun.write(join(appDir, "SPEC.md"), options.spec);

  const iterations: Iteration[] = [];
  let final: ProveResult | undefined;
  let prompt =
    "Read CONTRACT.md and SPEC.md in this workspace. Implement the screen described in SPEC.md in public/ " +
    "(index.html, app.js, style.css) so it follows CONTRACT.md exactly. Do not touch server.ts.";

  // An app already generated is proved first: Muse Code is only called when something differs.
  const built = !(await Bun.file(join(appDir, "public", "app.js")).text()).startsWith("// Muse Code fills");
  if (built) {
    const first = await proveApp(config, appDir, options.proof).catch((error) => ({ error: String(error) }));
    if ("error" in first) {
      prompt = `Replaying SPEC.md on the app failed: ${first.error.slice(0, 500)}. Fix public/ to follow CONTRACT.md.`;
    } else {
      final = first;
      iterations.push({ n: 0, kind: "repair", costUsd: 0, equal: first.equal, ...counts(first) });
      if (first.equal) return { appDir, iterations, final };
      prompt = repairPrompt(first);
    }
  }

  for (let n = 1; n <= (options.maxIterations ?? 3); n++) {
    const run = await runMuseCode(
      {
        apiKey,
        model: config.PARITY_MODEL_STRUCTURED,
        workspace: appDir,
        prompt,
        maxSteps: options.maxSteps ?? 40,
        runId: options.runId,
      },
      ledger,
    );
    const it: Iteration = {
      n,
      kind: n === 1 && !built ? "build" : "repair",
      costUsd: run.costUsd,
      equal: false,
      different: 0,
      missing: 0,
    };
    iterations.push(it);
    if (!run.ok) {
      it.error = `Muse Code exited with ${run.exitCode}: ${run.stderr.slice(-300)}`;
      break;
    }
    try {
      final = await proveApp(config, appDir, options.proof);
    } catch (error) {
      it.error = String(error);
      prompt = `Replaying SPEC.md on the app failed: ${String(error).slice(0, 500)}. Fix public/ so the inputs, button and displayed values follow CONTRACT.md.`;
      continue;
    }
    it.equal = final.equal;
    Object.assign(it, counts(final));
    if (final.equal) break;
    prompt = repairPrompt(final);
  }
  return { appDir, iterations, final };
}
