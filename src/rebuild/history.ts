import type { Iteration } from "./rebuild";

/** One proof of the app during a rebuild or a repair, kept per run so the screen can show parity over time. */
export interface HistoryEntry extends Iteration {
  at: string;
  /** What started it: the rebuild command, a fuzz round, or the button on the diff screen. */
  source: string;
}

const KEEP = 200;

export async function readHistory(file: string): Promise<HistoryEntry[]> {
  const f = Bun.file(file);
  if (!(await f.exists())) return [];
  const parsed = await f.json().catch(() => []);
  return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
}

export async function appendHistory(file: string, iterations: Iteration[], source: string): Promise<void> {
  if (iterations.length === 0) return;
  const at = new Date().toISOString();
  const all = [...(await readHistory(file)), ...iterations.map((it) => ({ ...it, at, source }))];
  await Bun.write(file, `${JSON.stringify(all.slice(-KEEP), null, 2)}\n`);
}
