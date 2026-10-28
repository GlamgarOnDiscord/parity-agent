import { z } from "zod";
import type { Iteration } from "./rebuild";

/** One proof of the app during a rebuild or a repair, kept per run so the screen can show parity over time. */
export interface HistoryEntry extends Iteration {
  at: string;
  /** What started it: the rebuild command, a fuzz round, or the button on the diff screen. */
  source: string;
}

const count = z.number().int().min(0).max(1e7);
// A run folder can come from someone else: every entry is checked before the screen prints it.
const EntrySchema = z.object({
  n: count,
  kind: z.enum(["build", "repair"]),
  costUsd: z.number().min(0).max(1e6),
  equal: z.boolean(),
  different: count,
  missing: count,
  fieldsEqual: count.optional(),
  fieldsCompared: count.optional(),
  selfChecks: count.optional(),
  error: z.string().max(1000).optional(),
  at: z.iso.datetime(),
  source: z.string().max(40),
});

const KEEP = 200;

export async function readHistory(file: string): Promise<HistoryEntry[]> {
  const f = Bun.file(file);
  if (!(await f.exists())) return [];
  const parsed = await f.json().catch(() => []);
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((e) => {
    const r = EntrySchema.safeParse(e);
    return r.success ? [r.data] : [];
  });
}

export async function appendHistory(file: string, iterations: Iteration[], source: string): Promise<void> {
  if (iterations.length === 0) return;
  const at = new Date().toISOString();
  const all = [...(await readHistory(file)), ...iterations.map((it) => ({ ...it, at: it.at ?? at, source }))];
  await Bun.write(file, `${JSON.stringify(all.slice(-KEEP), null, 2)}\n`);
}
