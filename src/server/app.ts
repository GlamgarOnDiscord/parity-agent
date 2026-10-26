import { Hono } from "hono";
import { z } from "zod";
import { matchScreens } from "../fields/match";
import type { Ledger } from "../models/ledger";

const FieldSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  value: z.string(),
  kind: z.enum(["money", "number", "percent", "date", "bool", "text"]).optional(),
  box: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }).optional(),
  group: z.string().optional(),
});
const ScreenSchema = z.object({
  id: z.string().min(1),
  app: z.string(),
  title: z.string().optional(),
  fields: z.array(FieldSchema).max(2000),
});
const MatchBody = z.object({
  legacy: ScreenSchema,
  rebuilt: ScreenSchema,
  mapping: z.record(z.string(), z.string()).optional(),
});

export function createApp(ledger: Ledger) {
  const app = new Hono();

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
