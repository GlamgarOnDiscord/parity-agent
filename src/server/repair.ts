import { join, relative, resolve, sep } from "node:path";

export interface RepairStatus {
  run: string;
  state: "running" | "done" | "failed";
  startedAt: string;
  endedAt?: string;
  /** The last lines the rebuild and the report printed. */
  log: string[];
}

export interface ReplayArgs {
  app?: string;
  referenceUrl?: string;
}

const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]"]);

/**
 * Repairs started from the diff screen: `parity rebuild` for one Muse Code iteration on the run's app, then
 * `parity report` so the screen shows the new replay. One at a time, fixed arguments, an app under generated/ only
 * and a reference on this machine only.
 */
export class RepairJobs {
  private current: RepairStatus | null = null;

  constructor(
    private readonly root: string,
    private readonly runsDir: string,
    private readonly spawn: (
      cmd: string[],
      cwd: string,
    ) => { lines: AsyncIterable<string>; exited: Promise<number> } = spawnLines,
  ) {}

  status(run: string): RepairStatus | null {
    return this.current?.run === run ? this.current : null;
  }

  /** Validated arguments for the two commands, or the reason they are refused. */
  commands(run: string, replay: ReplayArgs | undefined): string[][] | string {
    if (!replay?.app) return "this run was not replayed on an app folder; run the rebuild command instead";
    const generated = resolve(this.root, "generated");
    const app = resolve(this.root, replay.app);
    if (!app.startsWith(generated + sep))
      return "only an app under generated/ can be repaired from this screen";
    const reference: string[] = [];
    if (replay.referenceUrl) {
      let url: URL;
      try {
        url = new URL(replay.referenceUrl);
      } catch {
        return "bad reference URL";
      }
      if (!/^https?:$/.test(url.protocol) || !LOOPBACK.has(url.hostname))
        return "the reference must be an app on this machine";
      reference.push("--reference-url", url.href);
    }
    const rel = relative(this.root, app).replaceAll("\\", "/");
    const runDir = relative(this.root, join(this.runsDir, run)).replaceAll("\\", "/");
    const bin = join(this.root, "bin", "parity.ts");
    return [
      [
        process.execPath,
        bin,
        "rebuild",
        runDir,
        "--app",
        rel,
        "--max",
        "1",
        "--steps",
        "12",
        "--source",
        "diff screen",
      ],
      [process.execPath, bin, "report", runDir, "--app", rel, ...reference],
    ];
  }

  start(run: string, replay: ReplayArgs | undefined): RepairStatus | string {
    if (this.current?.state === "running") return `a repair of ${this.current.run} is already running`;
    const commands = this.commands(run, replay);
    if (typeof commands === "string") return commands;
    const job: RepairStatus = { run, state: "running", startedAt: new Date().toISOString(), log: [] };
    this.current = job;
    const push = (line: string) => {
      job.log.push(line);
      if (job.log.length > 200) job.log.shift();
    };
    (async () => {
      for (const cmd of commands) {
        push(`$ parity ${cmd.slice(2).join(" ")}`);
        const p = this.spawn(cmd, this.root);
        for await (const line of p.lines) push(line);
        const code = await p.exited;
        // The rebuild exits 1 while differences remain; the report still has to run to show them.
        if (code > 1) {
          push(`exited with ${code}`);
          job.state = "failed";
          job.endedAt = new Date().toISOString();
          return;
        }
      }
      job.state = "done";
      job.endedAt = new Date().toISOString();
    })().catch((error: unknown) => {
      push(String(error));
      job.state = "failed";
      job.endedAt = new Date().toISOString();
    });
    return job;
  }
}

function spawnLines(cmd: string[], cwd: string) {
  const proc = Bun.spawn(cmd, { cwd, stdout: "pipe", stderr: "pipe", env: process.env });
  async function* lines() {
    const decoder = new TextDecoder();
    let rest = "";
    for await (const chunk of mergeStreams(proc.stdout, proc.stderr)) {
      rest += decoder.decode(chunk, { stream: true });
      const parts = rest.split(/\r?\n/);
      rest = parts.pop() ?? "";
      for (const p of parts) if (p.trim()) yield p.slice(0, 400);
    }
    if (rest.trim()) yield rest.slice(0, 400);
  }
  return { lines: lines(), exited: proc.exited };
}

async function* mergeStreams(...streams: ReadableStream<Uint8Array>[]) {
  const readers = streams.map((s) => s.getReader());
  const pending = new Map(readers.map((r, i) => [i, r.read().then((x) => ({ i, x }))]));
  while (pending.size) {
    const { i, x } = await Promise.race(pending.values());
    if (x.done) {
      pending.delete(i);
      continue;
    }
    yield x.value;
    pending.set(
      i,
      (readers[i] as ReadableStreamDefaultReader<Uint8Array>).read().then((y) => ({ i, x: y })),
    );
  }
}
