import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Ledger } from "./ledger";

export interface MuseCodeRun {
  ok: boolean;
  exitCode: number;
  models: { model: string; inputTokens: number; outputTokens: number; calls: number }[];
  costUsd: number;
  stderr: string;
}

export interface MuseCodeOptions {
  apiKey: string;
  /** Standard-tier model; enforced, Muse Code otherwise defaults to a contributor model. */
  model: string;
  workspace: string;
  prompt: string;
  maxSteps?: number;
  runId?: string;
  timeoutMs?: number;
}

const MUSE_PATHS = [
  process.env.PARITY_MUSE_PATH,
  join(process.env.LOCALAPPDATA ?? "", "Programs", "muse", "muse.cmd"),
  "/usr/local/bin/muse",
].filter((p): p is string => Boolean(p));

interface UsageModel {
  model: string;
  input_tokens: number;
  output_tokens: number;
  calls: number;
}

/**
 * Run Muse Code headless on one workspace. Verified 2026-10-26: `--contributor-mode off` alone still ran
 * muse-spark-1.3-contributor, so the model is always passed explicitly and the run's own usage report is
 * checked; any contributor model in it fails the run.
 */
export async function runMuseCode(options: MuseCodeOptions, ledger: Ledger): Promise<MuseCodeRun> {
  if (options.model.endsWith("-contributor")) throw new Error("contributor models are not allowed");
  const muse = MUSE_PATHS.find((p) => existsSync(p));
  if (!muse) throw new Error("Muse Code not found; install it or set PARITY_MUSE_PATH");
  const started = performance.now();
  const proc = Bun.spawn(
    [
      ...(muse.endsWith(".cmd") ? ["cmd", "/c", muse] : [muse]),
      "exec",
      "--api-key-stdin",
      "--contributor-mode",
      "off",
      "--model",
      options.model,
      "--no-foreign-personal-context",
      "--workspace",
      options.workspace,
      "--max-model-steps",
      String(options.maxSteps ?? 40),
      "--json",
      options.prompt,
    ],
    { stdin: "pipe", stdout: "pipe", stderr: "pipe" },
  );
  proc.stdin.write(options.apiKey);
  await proc.stdin.end();
  const timer = setTimeout(() => proc.kill(), options.timeoutMs ?? 15 * 60_000);
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  clearTimeout(timer);

  const models: UsageModel[] = [];
  for (const line of stdout.split("\n")) {
    if (!line.includes('"run.usage"')) continue;
    try {
      const event = JSON.parse(line) as { payload_type?: string; payload?: { models?: UsageModel[] } };
      if (event.payload_type === "run.usage") models.push(...(event.payload?.models ?? []));
    } catch {
      // Not every line is an event; skip partial output.
    }
  }

  let costUsd = 0;
  for (const m of models) {
    const call = ledger.record({
      runId: options.runId,
      role: "code",
      provider: "muse-code",
      model: m.model,
      usage: { inputTokens: m.input_tokens, outputTokens: m.output_tokens },
      sentBytes: options.prompt.length,
      durationMs: Math.round(performance.now() - started),
      ok: exitCode === 0,
    });
    costUsd += call.costUsd;
  }

  const contributor = models.find((m) => m.model.endsWith("-contributor"));
  if (contributor) {
    throw new Error(`Muse Code ran ${contributor.model}; refusing a contributor-tier result`);
  }
  return {
    ok: exitCode === 0,
    exitCode,
    models: models.map((m) => ({
      model: m.model,
      inputTokens: m.input_tokens,
      outputTokens: m.output_tokens,
      calls: m.calls,
    })),
    costUsd,
    stderr: stderr.slice(-2000),
  };
}
