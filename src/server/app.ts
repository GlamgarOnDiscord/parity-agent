import { Hono } from "hono";
import { z } from "zod";
import { matchScreens } from "../fields/match";
import type { Ledger } from "../models/ledger";
import { ScreenSchema } from "../proof/schema";

const MatchBody = z.object({
  legacy: ScreenSchema,
  rebuilt: ScreenSchema,
  mapping: z.record(z.string().max(128), z.string().max(128)).optional(),
});

export interface AppOptions {
  /** Per-launch secret required on /api/*. */
  token: string;
  port: number;
}

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
