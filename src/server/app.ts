import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { Hono } from "hono";
import { z } from "zod";
import { matchScreens } from "../fields/match";
import type { Ledger } from "../models/ledger";
import { ScreenSchema } from "../proof/schema";
import type { RuleStore } from "../rules/store";
import { reviewPage } from "./review";

const MatchBody = z.object({
  legacy: ScreenSchema,
  rebuilt: ScreenSchema,
  mapping: z.record(z.string().max(128), z.string().max(128)).optional(),
});

export interface AppOptions {
  /** Per-launch secret required on /api/*. */
  token: string;
  port: number;
  rules: RuleStore;
  /** Where captures live: runs/<run>/frames/frame-0001.png */
  runsDir: string;
}

const RUN = /^[\w.-]{1,64}$/;
const Decision = z.object({
  status: z.enum(["accepted", "rejected"]),
  note: z.string().max(1000).optional(),
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
  app.use("/api/*", async (c, next) => {
    if (c.req.header("authorization") !== `Bearer ${options.token}`)
      return c.json({ error: "unauthorized" }, 401);
    if (c.req.method === "POST" && !c.req.header("content-type")?.startsWith("application/json")) {
      return c.json({ error: "expected application/json" }, 415);
    }
    await next();
  });

  app.get("/health", (c) => c.json({ ok: true }));

  app.get("/review/:run", (c) => {
    const run = c.req.param("run");
    if (!RUN.test(run)) return c.text("bad run", 400);
    return c.html(reviewPage(run, options.token));
  });

  app.get("/api/runs", (c) => c.json(options.rules.runs()));
  app.get("/api/runs/:run/rules", (c) => {
    const run = c.req.param("run");
    if (!RUN.test(run)) return c.json({ error: "bad run" }, 400);
    return c.json(options.rules.list(run));
  });
  app.post("/api/runs/:run/rules/:rule", async (c) => {
    const run = c.req.param("run");
    if (!RUN.test(run)) return c.json({ error: "bad run" }, 400);
    const body = Decision.safeParse(await c.req.json().catch(() => null));
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
