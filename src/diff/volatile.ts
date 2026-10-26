import { normalizeValue } from "../fields/normalize";
import type { Screen } from "../fields/types";

/**
 * How a noisy field is named in a proof. A bare label masks that label everywhere. When the label also appears in
 * other groups (one per grid row), the name is narrowed: `Total @ row-3`, or `Price @ none` for the ungrouped one.
 */
export function volatileKey(field: { label: string; group?: string }, screen?: Screen): string {
  const shared = screen?.fields.some((f) => f.label === field.label && f.group !== field.group) ?? false;
  if (!shared) return field.label;
  return `${field.label} @ ${field.group ?? "none"}`;
}

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
    // A label can repeat (one per grid row): twins are the same label, in the same group, at the same rank.
    const keyed = (fields: Screen["fields"]) => {
      const seen = new Map<string, number>();
      return fields.map((f) => {
        const base = `${f.group ?? ""}\u0000${f.label}`;
        const n = (seen.get(base) ?? 0) + 1;
        seen.set(base, n);
        return [`${base}\u0000${n}`, f] as const;
      });
    };
    const byKey = new Map(keyed(other.fields));
    for (const [key, field] of keyed(screen.fields)) {
      const twin = byKey.get(key);
      if (!twin) continue;
      const a = normalizeValue(field.value, field.kind);
      const b = normalizeValue(twin.value, field.kind);
      if (a.value !== b.value) labels.add(volatileKey(field, screen));
    }
  });
  return [...labels].sort();
}
