import {
  closeSync,
  cpSync,
  existsSync,
  fstatSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
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
  /** Times Muse Code proved its own change through the Parity MCP server. */
  selfChecks?: number;
  error?: string;
}

export interface RebuildResult {
  appDir: string;
  iterations: Iteration[];
  final?: ProveResult;
}

const TEMPLATE = resolve("templates/generated-app");

const SERVED = /\.(html|css|js|json|png|svg|ico|woff2?)$/i;

/**
 * Copy the files the app serves, and nothing that could point outside the model's workspace: no symbolic link
 * or junction, no hard link, only known web file types.
 */
function copyRegular(from: string, to: string, depth = 0): void {
  if (depth > 8) return;
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    const src = join(from, name);
    const st = lstatSync(src);
    if (st.isSymbolicLink()) continue;
    if (st.isDirectory()) {
      if (realpathSync(src) === join(realpathSync(from), name)) copyRegular(src, join(to, name), depth + 1);
    } else if (st.isFile() && st.nlink === 1 && st.size <= 5_000_000 && SERVED.test(name)) {
      // Read through the descriptor that was checked: same inode as the lstat above, so a link swapped in
      // between the two calls is refused instead of followed.
      const fd = openSync(src, "r");
      try {
        const opened = fstatSync(fd);
        if (opened.isFile() && opened.ino === st.ino && opened.dev === st.dev && opened.nlink === 1) {
          writeFileSync(join(to, name), readFileSync(fd));
        }
      } finally {
        closeSync(fd);
      }
    }
  }
}

/** The public/ directory of the app, only if it is a real directory inside the app. */
function publicDirOf(appDir: string): string {
  const dir = join(appDir, "public");
  const st = lstatSync(dir);
  if (
    st.isSymbolicLink() ||
    !st.isDirectory() ||
    realpathSync(dir) !== join(realpathSync(appDir), "public")
  ) {
    throw new Error("public/ must be a real directory inside the app");
  }
  return dir;
}

/**
 * Start the generated app from a fresh staging directory: the trusted server.ts from the template plus the
 * regular files of public/. Generated code never runs on the host, only in the headless browser.
 */
export async function startApp(appDir: string): Promise<{ url: string; stop: () => void }> {
  const stage = mkdtempSync(join(tmpdir(), "parity-app-"));
  cpSync(join(TEMPLATE, "server.ts"), join(stage, "server.ts"));
  copyRegular(publicDirOf(appDir), join(stage, "public"));
  const proc = Bun.spawn([process.execPath, join(stage, "server.ts")], {
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
      return {
        url: `${m[1]}/`,
        stop: () => {
          proc.kill();
          proc.exited.then(() => rmSync(stage, { recursive: true, force: true }));
        },
      };
    }
  }
  proc.kill();
  rmSync(stage, { recursive: true, force: true });
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

/** What the user typed and clicked before a checkpoint: without it, a wrong value cannot be traced to its input. */
function inputsBefore(proof: Proof, scenarioId: string, step: number): string {
  const scenario = proof.scenarios.find((s) => s.id === scenarioId);
  return (scenario?.steps.slice(0, step) ?? [])
    .map((s) => (s.do === "fill" ? `${s.field} = ${s.value}` : s.do === "click" ? `click ${s.target}` : null))
    .filter(Boolean)
    .join("; ");
}

export function repairPrompt(result: ProveResult, proof: Proof): string {
  const lines = [
    "The rebuilt app does not match the legacy app yet. Parity replayed the scenarios below on both apps and",
    "compared every field in plain code. Fix public/ so every field matches exactly; keep CONTRACT.md.",
  ];
  for (const c of result.checkpoints) {
    const different = c.diff.fields.filter((x) => x.verdict === "different");
    if (different.length === 0 && c.diff.missingInRebuilt.length === 0) continue;
    lines.push(
      "",
      `Scenario \`${c.scenario}\`, after: ${inputsBefore(proof, c.scenario, c.step) || "opening"}`,
    );
    for (const f of different) {
      const at = f.legacy.group ? ` (line ${f.legacy.group})` : "";
      lines.push(
        `- \`${f.legacy.label}\`${at}: the legacy app shows \`${f.legacy.value}\`, the rebuilt app shows \`${f.rebuilt.value}\``,
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
    "A value tied to one input (the description or price of one item code) is data of the legacy app: take it",
    "from the scenario that shows it, never guess it. Keep every case that already matches.",
    "Re-read the business rules and their formulas in SPEC.md, especially where rounding happens, and check every",
    "rule of CONTRACT.md, including the data-group on each line of a grid: Parity pairs repeated labels by line.",
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
    /**
     * Attach Parity as an MCP server so Muse Code proves its own change before it stops: the proof file and the
     * project root it is read from.
     */
    selfCheck?: { root: string; proofPath: string };
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
      prompt = repairPrompt(first, options.proof);
    }
  }

  const self = options.selfCheck;
  const selfCheckNote = self
    ? [
        "",
        "Before you stop, prove your change: call the `prove` tool of the `parity` MCP server with",
        `proof = "${relative(self.root, self.proofPath).replaceAll("\\", "/")}" and app = "${relative(self.root, appDir).replaceAll("\\", "/")}".`,
        "It replays the legacy scenario on this app and lists every field that still differs. Fix and call it again",
        "until it answers Parity. Do not edit the proof.",
      ].join("\n")
    : "";

  for (let n = 1; n <= (options.maxIterations ?? 2); n++) {
    const run = await runMuseCode(
      {
        apiKey,
        model: config.PARITY_MODEL_STRUCTURED,
        workspace: appDir,
        prompt: prompt + selfCheckNote,
        maxSteps: options.maxSteps ?? 20,
        runId: options.runId,
        eventsFile: join(appDir, "..", `muse-run-${n}.jsonl`),
        mcpServers: self
          ? {
              parity: {
                command: process.execPath,
                // Pinned: the agent can prove this app against this proof, nothing else.
                args: [
                  join(self.root, "bin", "parity.ts"),
                  "mcp",
                  "--proof",
                  self.proofPath,
                  "--app",
                  appDir,
                ],
              },
            }
          : undefined,
      },
      ledger,
    );
    const it: Iteration = {
      n,
      kind: n === 1 && !built ? "build" : "repair",
      costUsd: run.costUsd,
      selfChecks: run.selfChecks,
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
    prompt = repairPrompt(final, options.proof);
  }
  return { appDir, iterations, final };
}
