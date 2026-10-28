import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import type { Capture } from "../capture/capture";
import { coverageOf } from "../coverage/coverage";
import { type Decision, reapplyDecisions } from "../diff/decisions";
import { matchScreens } from "../fields/match";
import type { Ledger } from "../models/ledger";
import { ProofSchema, ScreenSchema } from "../proof/schema";
import { readHistory } from "../rebuild/history";
import { isEqual } from "../replay/prove";
import { workedExample } from "../rules/extract";
import type { RuleStore } from "../rules/store";
import { type DiffInput, diffPage, type SavedResult } from "./diff";
import type { RepairJobs } from "./repair";
import { reviewPage } from "./review";

const MatchBody = z.object({
  legacy: ScreenSchema,
  rebuilt: ScreenSchema,
  mapping: z.record(z.string().max(128), z.string().max(128)).optional(),
});

export interface AppOptions {
  /** Per-launch secret for scripts on /api/*. */
  token: string;
  /** One-time key that opens a browser session (/open?k=...). */
  launchKey?: string;
  port: number;
  rules: RuleStore;
  /** Where captures live: runs/<run>/frames/frame-0001.png */
  runsDir: string;
  /** Repairs started from the diff screen; without it the button is not offered. */
  repairs?: RepairJobs;
}

const RUN = /^[\w.-]{1,64}$/;
const EVIDENCE = /^[\w.-]{1,96}\.png$/;
const FONTS = new Set(["Geist-Variable.woff2", "GeistMono-Variable.woff2"]);
const FONT_DIR = join(import.meta.dir, "assets", "fonts");
const RuleDecision = z.object({
  status: z.enum(["accepted", "rejected"]),
  note: z.string().max(1000).optional(),
});
const AcceptBody = z.object({
  scenario: z.string().min(1).max(128),
  step: z.number().int().min(0).max(100_000),
  field: z.string().min(1).max(256),
  group: z.string().max(256).optional(),
  kind: z.enum(["legacy-bug", "change"]),
  by: z.string().trim().min(1).max(80),
  why: z.string().trim().min(3).max(1000),
});
const RevokeBody = z.object({
  screen: z.string().min(1).max(128),
  field: z.string().min(1).max(256),
  group: z.string().max(256).optional(),
});

export function createApp(ledger: Ledger, options: AppOptions) {
  const app = new Hono();
  const allowedHosts = new Set([`127.0.0.1:${options.port}`, `localhost:${options.port}`]);

  // Local only, and not reachable from a web page through DNS rebinding or a cross-site request.
  app.use("*", async (c, next) => {
    if (!allowedHosts.has(c.req.header("host") ?? "")) return c.json({ error: "forbidden host" }, 403);
    const origin = c.req.header("origin");
    if (origin && !allowedHosts.has(origin.replace(/^https?:\/\//, ""))) {
      return c.json({ error: "forbidden origin" }, 403);
    }
    await next();
  });
  // Browser sessions: a one-time launch key, printed at startup, is exchanged for an HttpOnly cookie.
  const session = crypto.randomUUID();
  let launchKey: string | null = options.launchKey ?? null;
  const SESSION_COOKIE = "parity_session";

  app.get("/open", (c) => {
    if (!launchKey || c.req.query("k") !== launchKey)
      return c.text("This link was already used or is wrong.", 403);
    launchKey = null;
    setCookie(c, SESSION_COOKIE, session, { httpOnly: true, sameSite: "Strict", path: "/" });
    const run = c.req.query("run");
    return c.redirect(run && RUN.test(run) ? `/review/${run}` : "/");
  });

  app.use("/api/*", async (c, next) => {
    const bearer = c.req.header("authorization") === `Bearer ${options.token}`;
    const cookie = getCookie(c, SESSION_COOKIE) === session;
    if (!bearer && !cookie) return c.json({ error: "unauthorized" }, 401);
    if (c.req.method === "POST" && !c.req.header("content-type")?.startsWith("application/json")) {
      return c.json({ error: "expected application/json" }, 415);
    }
    await next();
  });

  app.get("/health", (c) => c.json({ ok: true }));

  // The two faces of the brand, served from this repository: no font is fetched from anywhere else.
  app.get("/assets/fonts/:file", (c) => {
    const file = c.req.param("file");
    if (!FONTS.has(file)) return c.text("not found", 404);
    return new Response(Bun.file(join(FONT_DIR, file)), {
      headers: { "content-type": "font/woff2", "cache-control": "max-age=86400" },
    });
  });

  app.get("/review/:run", (c) => {
    const run = c.req.param("run");
    if (!RUN.test(run)) return c.text("bad run", 400);
    if (getCookie(c, SESSION_COOKIE) !== session)
      return c.text("Open the link printed by the server first.", 401);
    return c.html(reviewPage(run));
  });

  app.get("/diff/:run", async (c) => {
    const run = c.req.param("run");
    if (!RUN.test(run)) return c.text("bad run", 400);
    if (getCookie(c, SESSION_COOKIE) !== session)
      return c.text("Open the link printed by the server first.", 401);
    const dir = resolve(options.runsDir, run);
    const json = async <T>(name: string): Promise<T | undefined> => {
      const f = Bun.file(join(dir, name));
      return (await f.exists()) ? ((await f.json().catch(() => undefined)) as T | undefined) : undefined;
    };
    const proof = ProofSchema.safeParse(await json("proof.json"));
    if (!proof.success) return c.text("No proof for this run yet.", 404);
    const capture = await json<Capture>("capture.json");
    const rules = options.rules.list(run).filter((r) => r.status !== "rejected");
    const ids = [run, `rebuild-${run}`];
    const totals = ids.map((id) => ledger.total(id));
    const input: DiffInput = {
      run,
      history: await readHistory(join(dir, "history.json")),
      repair: options.repairs
        ? { available: true, status: options.repairs.status(run) ?? undefined }
        : { available: false },
      proof: proof.data,
      saved: await json<SavedResult>("result.json"),
      coverage: Array.isArray(capture?.frames) ? coverageOf(capture, proof.data, rules) : undefined,
      calls: {
        calls: totals.reduce((n, t) => n + t.calls, 0),
        costUsd: totals.reduce((n, t) => n + t.costUsd, 0),
        sentBytes: totals.reduce((n, t) => n + t.sentBytes, 0),
      },
      exploration: await json<DiffInput["exploration"]>("exploration.json"),
      budgetUsd: ledger.budgetUsd,
    };
    return c.html(diffPage(input));
  });

  app.get("/api/runs", (c) => c.json(options.rules.runs()));
  // Evidence for one rule: where its field sits on each recorded frame, and the formula worked out on one frame.
  app.get("/api/runs/:run/rules/:rule/evidence", async (c) => {
    const run = c.req.param("run");
    if (!RUN.test(run)) return c.json({ error: "bad run" }, 400);
    const rule = options.rules.list(run).find((r) => r.id === c.req.param("rule"));
    if (!rule) return c.json({ error: "no such rule" }, 404);
    const file = Bun.file(join(resolve(options.runsDir), run, "capture.json"));
    const capture = (await file.exists()) ? ((await file.json().catch(() => null)) as Capture | null) : null;
    if (!Array.isArray(capture?.frames)) return c.json({ worked: null, frames: [] });
    const key = (s: string) =>
      s
        .replace(/[\s:]+$/, "")
        .trim()
        .toLowerCase();
    const target = rule.target ?? rule.fields[0] ?? "";
    return c.json({
      worked:
        rule.target && rule.expression
          ? (workedExample(capture, rule.target, rule.expression) ?? null)
          : null,
      frames: rule.evidence.frames.map((f) => ({
        index: f.index,
        box:
          capture.frames[f.index - 1]?.screen.fields.find((x) => key(x.label) === key(target))?.box ?? null,
      })),
    });
  });

  app.get("/api/runs/:run/evidence/:file", (c) => {
    const run = c.req.param("run");
    const file = c.req.param("file");
    if (!RUN.test(run) || !EVIDENCE.test(file)) return c.json({ error: "bad evidence" }, 400);
    const root = resolve(options.runsDir);
    const path = resolve(join(root, run, "evidence", file));
    if (!path.startsWith(root) || !existsSync(path)) return c.json({ error: "no such evidence" }, 404);
    return new Response(Bun.file(path), { headers: { "content-type": "image/png" } });
  });
  app.get("/api/runs/:run/rules", (c) => {
    const run = c.req.param("run");
    if (!RUN.test(run)) return c.json({ error: "bad run" }, 400);
    return c.json(options.rules.list(run));
  });
  app.post("/api/runs/:run/rules/:rule", async (c) => {
    const run = c.req.param("run");
    if (!RUN.test(run)) return c.json({ error: "bad run" }, 400);
    const body = RuleDecision.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: z.prettifyError(body.error) }, 400);
    const rule = options.rules.decide(run, c.req.param("rule"), body.data.status, body.data.note);
    return rule ? c.json(rule) : c.json({ error: "no such rule" }, 404);
  });
  app.get("/api/runs/:run/frames/:n", async (c) => {
    const run = c.req.param("run");
    const n = Number(c.req.param("n"));
    if (!RUN.test(run) || !Number.isInteger(n) || n < 1 || n > 9999)
      return c.json({ error: "bad frame" }, 400);
    const root = resolve(options.runsDir);
    const file = resolve(join(root, run, "frames", `frame-${String(n).padStart(4, "0")}.png`));
    if (!file.startsWith(root) || !existsSync(file)) return c.json({ error: "no such frame" }, 404);
    return new Response(Bun.file(file), { headers: { "content-type": "image/png" } });
  });

  app.get("/api/runs/:run/coverage", async (c) => {
    const run = c.req.param("run");
    if (!RUN.test(run)) return c.json({ error: "bad run" }, 400);
    const dir = resolve(options.runsDir, run);
    const capture = Bun.file(join(dir, "capture.json"));
    const proof = Bun.file(join(dir, "proof.json"));
    if (!(await capture.exists()) || !(await proof.exists()))
      return c.json({ error: "no capture or proof" }, 404);
    const parsed = ProofSchema.safeParse(await proof.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "invalid proof" }, 422);
    const rules = options.rules.list(run).filter((r) => r.status !== "rejected");
    const captured = (await capture.json().catch(() => null)) as Capture | null;
    if (!Array.isArray(captured?.frames)) return c.json({ error: "invalid capture" }, 422);
    return c.json(coverageOf(captured, parsed.data, rules));
  });
  // Calls made for a run: its capture and its rebuilds.
  app.get("/api/runs/:run/calls", (c) => {
    const run = c.req.param("run");
    if (!RUN.test(run)) return c.json({ error: "bad run" }, 400);
    const ids = [run, `rebuild-${run}`];
    const calls = ids.flatMap((id) => ledger.list(id)).sort((a, b) => b.id - a.id);
    const totals = ids.map((id) => ledger.total(id));
    return c.json({
      calls,
      total: {
        calls: totals.reduce((n, t) => n + t.calls, 0),
        costUsd: totals.reduce((n, t) => n + t.costUsd, 0),
        sentBytes: totals.reduce((n, t) => n + t.sentBytes, 0),
      },
    });
  });

  // Decisions on differences: stored in the run's proof, applied to its last replay at once.
  const runFiles = async (run: string) => {
    const dir = resolve(options.runsDir, run);
    const proofFile = Bun.file(join(dir, "proof.json"));
    const resultFile = Bun.file(join(dir, "result.json"));
    if (!(await proofFile.exists()) || !(await resultFile.exists())) return null;
    const proof = ProofSchema.safeParse(await proofFile.json().catch(() => null));
    const saved = (await resultFile.json().catch(() => null)) as SavedResult | null;
    if (!proof.success || !saved || !Array.isArray(saved.result?.checkpoints)) return null;
    return { dir, proof: proof.data, saved };
  };
  const saveDecisions = async (
    files: NonNullable<Awaited<ReturnType<typeof runFiles>>>,
    decisions: Decision[],
  ) => {
    const proof = { ...files.proof, decisions };
    const checkpoints = files.saved.result.checkpoints.map((c) => ({
      ...c,
      diff: reapplyDecisions(c.diff, c.screen, decisions),
    }));
    const saved = {
      ...files.saved,
      result: { ...files.saved.result, checkpoints, equal: isEqual(checkpoints) },
    };
    await Bun.write(join(files.dir, "proof.json"), `${JSON.stringify(proof, null, 2)}\n`);
    await Bun.write(join(files.dir, "result.json"), JSON.stringify(saved, null, 2));
    return saved.result;
  };
  const busy = (run: string) => options.repairs?.status(run)?.state === "running";
  const sameDecision = (
    d: Pick<Decision, "screen" | "field" | "group">,
    e: Pick<Decision, "screen" | "field" | "group">,
  ) => d.screen === e.screen && d.field === e.field && (d.group ?? null) === (e.group ?? null);

  app.post("/api/runs/:run/decisions", async (c) => {
    const run = c.req.param("run");
    if (!RUN.test(run)) return c.json({ error: "bad run" }, 400);
    if (busy(run)) return c.json({ error: "a repair of this run is running" }, 409);
    const body = AcceptBody.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: z.prettifyError(body.error) }, 400);
    const files = await runFiles(run);
    if (!files) return c.json({ error: "no proof or replay for this run" }, 404);
    const b = body.data;
    const checkpoint = files.saved.result.checkpoints.find(
      (x) => x.scenario === b.scenario && x.step === b.step,
    );
    const f = checkpoint?.diff.fields.find(
      (x) =>
        x.verdict === "different" &&
        x.legacy.label === b.field &&
        (x.legacy.group ?? null) === (b.group ?? null),
    );
    if (!checkpoint || !f) return c.json({ error: "no such difference in the last replay" }, 404);
    const decision: Decision = {
      screen: checkpoint.screen,
      field: b.field,
      group: b.group,
      legacy: f.legacyValue,
      rebuilt: f.rebuiltValue,
      kind: b.kind,
      by: b.by,
      why: b.why,
      at: new Date().toISOString(),
    };
    const others = files.proof.decisions.filter((d) => !sameDecision(d, decision));
    const result = await saveDecisions(files, [...others, decision]);
    return c.json({ decision, equal: result.equal });
  });

  app.post("/api/runs/:run/decisions/revoke", async (c) => {
    const run = c.req.param("run");
    if (!RUN.test(run)) return c.json({ error: "bad run" }, 400);
    if (busy(run)) return c.json({ error: "a repair of this run is running" }, 409);
    const body = RevokeBody.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: z.prettifyError(body.error) }, 400);
    const files = await runFiles(run);
    if (!files) return c.json({ error: "no proof or replay for this run" }, 404);
    const kept = files.proof.decisions.filter((d) => !sameDecision(d, body.data));
    if (kept.length === files.proof.decisions.length) return c.json({ error: "no such decision" }, 404);
    const result = await saveDecisions(files, kept);
    return c.json({ equal: result.equal });
  });

  // One Muse Code repair from the diff screen, then a new replay; the page polls for progress.
  app.post("/api/runs/:run/repair", async (c) => {
    const run = c.req.param("run");
    if (!RUN.test(run)) return c.json({ error: "bad run" }, 400);
    if (!options.repairs) return c.json({ error: "repairs are not enabled on this server" }, 404);
    const files = await runFiles(run);
    if (!files) return c.json({ error: "no proof or replay for this run" }, 404);
    if (files.saved.result.equal) return c.json({ error: "nothing to repair: this run has parity" }, 409);
    const job = options.repairs.start(run, files.saved.replay);
    return typeof job === "string" ? c.json({ error: job }, 409) : c.json(job, 202);
  });
  app.get("/api/runs/:run/repair", (c) => {
    const run = c.req.param("run");
    if (!RUN.test(run)) return c.json({ error: "bad run" }, 400);
    return c.json(options.repairs?.status(run) ?? { run, state: "idle", log: [] });
  });

  // The send log: everything that left the machine, and what it cost.
  app.get("/api/calls", (c) => c.json(ledger.list(c.req.query("run"))));
  app.get("/api/calls/total", (c) => c.json(ledger.total(c.req.query("run"))));

  app.post("/api/match", async (c) => {
    const body = MatchBody.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: z.prettifyError(body.error) }, 400);
    try {
      return c.json(matchScreens(body.data.legacy, body.data.rebuilt, { mapping: body.data.mapping }));
    } catch (error) {
      return c.json({ error: String(error) }, 422);
    }
  });

  return app;
}
