import { existsSync, mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Capture } from "../capture/capture";
import { coverageOf } from "../coverage/coverage";
import { ProofSchema } from "../proof/schema";
import type { RuleStore } from "../rules/store";

export interface ParityMcpOptions {
  /** Project root: every path a tool receives must resolve inside it. */
  root: string;
  /** Where runs live, usually <root>/runs. */
  runsDir: string;
  rules: RuleStore;
  /** The parity command, for the replays (each runs in its own process with its own browser). */
  parityBin: string;
  /**
   * Pinned mode, for an agent repairing one app: `prove` only accepts this proof and this app folder, no URL, and
   * the other tools are not offered. The agent cannot point the browser at another local service or at a proof
   * it wrote itself.
   */
  pinned?: { proof: string; app: string };
}

const RUN = /^[\w.-]{1,64}$/;
const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]"]);

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });
const refuse = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true });

/**
 * Parity as tools for a coding agent. Nothing here calls a model: the agent proposes a change, Parity replays the
 * proof and answers with every field that moved. Paths stay inside the project and apps must run on this machine.
 */
export function createParityMcp(o: ParityMcpOptions) {
  const root = resolve(o.root);
  const inside = (p: string) => {
    const full = resolve(root, p);
    return full === root || full.startsWith(root + sep) ? full : null;
  };
  const server = new McpServer({ name: "parity", version: "0.2.0" });

  server.registerTool(
    "prove",
    {
      title: "Prove a change",
      description:
        "Replay a Parity proof on a web app running on this machine and report every field that differs from the reference. Run it after changing an app that has a proof; a difference means the change altered behaviour the proof recorded. No model call.",
      inputSchema: {
        proof: z.string().describe("Path of the proof JSON, relative to the project root"),
        url: z.string().optional().describe("URL of the running app, on 127.0.0.1 or localhost"),
        app: z
          .string()
          .optional()
          .describe("Folder of a rebuilt app to serve instead of a URL, relative to the project root"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ proof, url, app }) => {
      if (o.pinned) {
        const same = (a: string | undefined, b: string) => a !== undefined && resolve(root, a) === resolve(b);
        if (url || !same(proof, o.pinned.proof) || !same(app, o.pinned.app))
          return refuse(
            `This session proves one app only: proof = "${relative(root, o.pinned.proof).replaceAll("\\", "/")}", app = "${relative(root, o.pinned.app).replaceAll("\\", "/")}".`,
          );
      }
      const proofPath = inside(proof);
      if (!proofPath || !existsSync(proofPath)) return refuse(`No proof at ${proof} inside the project.`);
      if (
        !ProofSchema.safeParse(
          await Bun.file(proofPath)
            .json()
            .catch(() => null),
        ).success
      )
        return refuse(`${proof} is not a Parity proof.`);
      const args = ["report", "--proof", proofPath];
      if (url) {
        let target: URL | undefined;
        try {
          target = new URL(url);
        } catch {}
        // Web apps only: a file: or other scheme on "localhost" would let a replay read local files.
        const web = target && (target.protocol === "http:" || target.protocol === "https:");
        if (!target || !web || !LOOPBACK.has(target.hostname))
          return refuse(
            "Parity only proves web apps running on this machine (http://127.0.0.1 or localhost).",
          );
        args.push("--url", target.href);
      } else if (app) {
        const dir = inside(app);
        if (!dir || !existsSync(dir)) return refuse(`No app folder at ${app} inside the project.`);
        args.push("--app", dir);
      } else {
        return refuse("Give the url of the running app, or the folder of a rebuilt app.");
      }
      const out = mkdtempSync(join(tmpdir(), "parity-mcp-"));
      args.push("--out", join(out, "report.html"), "--summary", join(out, "summary.md"));
      const p = Bun.spawn([process.execPath, o.parityBin, ...args], {
        cwd: root,
        stdout: "pipe",
        stderr: "pipe",
      });
      const [code, stderr] = await Promise.all([p.exited, new Response(p.stderr).text()]);
      const summary = Bun.file(join(out, "summary.md"));
      if (!(await summary.exists())) return refuse(`The replay did not finish: ${stderr.slice(-600)}`);
      return text(`${await summary.text()}\nReport: ${join(out, "report.html")}\nExit code: ${code}`);
    },
  );

  if (o.pinned) return server;

  server.registerTool(
    "runs",
    {
      title: "List runs",
      description:
        "List the Parity runs of this project: captured recordings with their proof, rules and last replay.",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      const dir = resolve(o.runsDir);
      const runs = existsSync(dir)
        ? readdirSync(dir, { withFileTypes: true })
            .filter((d) => d.isDirectory() && RUN.test(d.name) && existsSync(join(dir, d.name, "proof.json")))
            .map((d) => {
              const has = (f: string) => existsSync(join(dir, d.name, f));
              return `- ${d.name}: proof${has("capture.json") ? ", capture" : ""}${has("result.json") ? ", last replay" : ""}, ${o.rules.list(d.name).length} rules (proof at ${relative(root, join(dir, d.name, "proof.json"))})`;
            })
        : [];
      return text(runs.length ? runs.join("\n") : "No runs yet.");
    },
  );

  server.registerTool(
    "rules",
    {
      title: "Business rules of a run",
      description:
        "The business rules Parity extracted from a recording, in plain language, with their formula, how many recorded screens the formula reproduces, and whether the domain expert accepted them. Use them to know what a change must keep true.",
      inputSchema: { run: z.string().regex(RUN).describe("Run name, from the runs tool") },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ run }) => {
      const rules = o.rules.list(run);
      if (!rules.length) return refuse(`No rules for run ${run}.`);
      return text(
        rules
          .map((r) =>
            [
              `${r.id} ${r.title} [${r.status}]`,
              `  ${r.statement}`,
              r.expression ? `  ${r.target} = ${r.expression}` : "",
              r.check
                ? `  checked on the recording: ${r.check.verified} frames reproduce it, ${r.check.contradicted} contradict it`
                : "",
            ]
              .filter(Boolean)
              .join("\n"),
          )
          .join("\n\n"),
      );
    },
  );

  server.registerTool(
    "coverage",
    {
      title: "Coverage of a run",
      description:
        "Which fields the recording showed, which the proof checks, which only a rule explains and which nothing tests. A change to a field nothing tests is not protected by the proof.",
      inputSchema: { run: z.string().regex(RUN).describe("Run name, from the runs tool") },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ run }) => {
      const dir = join(resolve(o.runsDir), run);
      const capture = (await Bun.file(join(dir, "capture.json"))
        .json()
        .catch(() => null)) as Capture | null;
      const proof = ProofSchema.safeParse(
        await Bun.file(join(dir, "proof.json"))
          .json()
          .catch(() => null),
      );
      if (!Array.isArray(capture?.frames) || !proof.success)
        return refuse(`Run ${run} has no capture or proof.`);
      const cov = coverageOf(
        capture,
        proof.data,
        o.rules.list(run).filter((r) => r.status !== "rejected"),
      );
      const group = (state: string) =>
        cov.rows
          .filter((r) => r.state === state)
          .map((r) => r.label)
          .join(", ") || "none";
      return text(
        `${cov.counts.tested} checked by the proof: ${group("tested")}\n${cov.counts.ruled} explained by a rule only: ${group("ruled")}\n${cov.counts.seen} never tested: ${group("seen")}`,
      );
    },
  );

  return server;
}
