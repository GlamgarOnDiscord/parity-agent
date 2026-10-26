import { normalizeValue } from "../fields/normalize";
import type { Screen } from "../fields/types";

/**
 * Noise is measured, not guessed: the same scenario is replayed twice on the same app, and every field whose
 * value changes between those two runs is volatile (a timestamp, a generated id). No AI, no heuristics.
 */
export function detectVolatile(firstRun: Screen[], secondRun: Screen[]): string[] {
  if (firstRun.length !== secondRun.length) {
    throw new Error(`runs differ in length (${firstRun.length} vs ${secondRun.length} checkpoints)`);
  }
  const labels = new Set<string>();
  firstRun.forEach((screen, i) => {
    const other = secondRun[i];
    if (!other) return;
    const byLabel = new Map(other.fields.map((f) => [f.label, f]));
    for (const field of screen.fields) {
      const twin = byLabel.get(field.label);
      if (!twin) continue;
      const a = normalizeValue(field.value, field.kind);
      const b = normalizeValue(twin.value, field.kind);
      if (a.value !== b.value) labels.add(field.label);
    }
  });
  return [...labels].sort();
}
