import { inferKind, labelTokens } from "./normalize";
import type { Field, FieldKind, Screen } from "./types";

export interface FieldMatch {
  legacy: Field;
  rebuilt: Field;
  score: number;
  via: "mapping" | "score";
  /** Another candidate scored almost as high: a human should confirm this pair. */
  ambiguous: boolean;
}

export interface ScreenMatch {
  matches: FieldMatch[];
  unmatchedLegacy: Field[];
  unmatchedRebuilt: Field[];
}

export interface MatchOptions {
  /** Explicit pairs, legacy field id to rebuilt field id. Always win. */
  mapping?: Record<string, string>;
  /** Pairs scoring below this are left unmatched. */
  threshold?: number;
  /** Gap under which the runner-up makes a match ambiguous. */
  ambiguityGap?: number;
}

const WEIGHTS = { label: 0.7, kind: 0.15, position: 0.15 };

function dice(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  const shared = new Set(a.filter((t) => setB.has(t))).size;
  return (2 * shared) / (new Set(a).size + setB.size);
}

function trigrams(s: string): Set<string> {
  const padded = `  ${s} `;
  const out = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) out.add(padded.slice(i, i + 3));
  return out;
}

function trigramSim(a: string, b: string): number {
  const ta = trigrams(a);
  const tb = trigrams(b);
  if (!ta.size || !tb.size) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return (2 * shared) / (ta.size + tb.size);
}

/** Similarity of two labels in [0, 1], robust to abbreviations, case, accents and extra words. */
export function labelSimilarity(a: string, b: string): number {
  const ta = labelTokens(a);
  const tb = labelTokens(b);
  if (!ta.length || !tb.length) return 0;
  const tokenScore = dice(ta, tb);
  const containment = ta.every((t) => tb.includes(t)) || tb.every((t) => ta.includes(t)) ? 0.85 : 0;
  return Math.max(tokenScore, containment, trigramSim(ta.join(" "), tb.join(" ")) * 0.9);
}

function kindOf(f: Field): FieldKind {
  return f.kind ?? inferKind(f.value);
}

function kindScore(a: Field, b: Field): number {
  const ka = kindOf(a);
  const kb = kindOf(b);
  if (ka === kb) return 1;
  const numeric = new Set<FieldKind>(["money", "number", "percent"]);
  return numeric.has(ka) && numeric.has(kb) ? 0.6 : 0;
}

function positionScore(a: Field, b: Field): number {
  if (!a.box || !b.box) return 0.5;
  const ca = { x: a.box.x + a.box.w / 2, y: a.box.y + a.box.h / 2 };
  const cb = { x: b.box.x + b.box.w / 2, y: b.box.y + b.box.h / 2 };
  return Math.max(0, 1 - Math.hypot(ca.x - cb.x, ca.y - cb.y) / Math.SQRT2);
}

/**
 * Score one pair. Values are deliberately ignored: two fields are the same field because of what they are,
 * never because they happen to hold the same value. Otherwise a regression could hide a mismatch.
 */
export function pairScore(a: Field, b: Field): number {
  const groupBonus = a.group && b.group && a.group === b.group ? 0.05 : 0;
  return Math.min(
    1,
    WEIGHTS.label * labelSimilarity(a.label, b.label) +
      WEIGHTS.kind * kindScore(a, b) +
      WEIGHTS.position * positionScore(a, b) +
      groupBonus,
  );
}

/** Pair the fields of a legacy screen with those of its rebuilt counterpart. Deterministic, no AI. */
export function matchScreens(legacy: Screen, rebuilt: Screen, options: MatchOptions = {}): ScreenMatch {
  const threshold = options.threshold ?? 0.55;
  const gap = options.ambiguityGap ?? 0.05;
  const usedLegacy = new Set<string>();
  const usedRebuilt = new Set<string>();
  const matches: FieldMatch[] = [];

  for (const [legacyId, rebuiltId] of Object.entries(options.mapping ?? {})) {
    const l = legacy.fields.find((f) => f.id === legacyId);
    const r = rebuilt.fields.find((f) => f.id === rebuiltId);
    if (!l || !r) throw new Error(`mapping ${legacyId} -> ${rebuiltId} names a field that does not exist`);
    matches.push({ legacy: l, rebuilt: r, score: 1, via: "mapping", ambiguous: false });
    usedLegacy.add(l.id);
    usedRebuilt.add(r.id);
  }

  const pairs: { l: Field; r: Field; score: number }[] = [];
  for (const l of legacy.fields) {
    if (usedLegacy.has(l.id)) continue;
    for (const r of rebuilt.fields) {
      if (usedRebuilt.has(r.id)) continue;
      pairs.push({ l, r, score: pairScore(l, r) });
    }
  }
  pairs.sort((x, y) => y.score - x.score || x.l.id.localeCompare(y.l.id) || x.r.id.localeCompare(y.r.id));

  for (const p of pairs) {
    if (p.score < threshold) break;
    if (usedLegacy.has(p.l.id) || usedRebuilt.has(p.r.id)) continue;
    const runnerUp = pairs.find(
      (q) =>
        q !== p &&
        ((q.l.id === p.l.id && !usedRebuilt.has(q.r.id)) || (q.r.id === p.r.id && !usedLegacy.has(q.l.id))),
    );
    matches.push({
      legacy: p.l,
      rebuilt: p.r,
      score: Number(p.score.toFixed(3)),
      via: "score",
      ambiguous: runnerUp !== undefined && p.score - runnerUp.score < gap,
    });
    usedLegacy.add(p.l.id);
    usedRebuilt.add(p.r.id);
  }

  return {
    matches,
    unmatchedLegacy: legacy.fields.filter((f) => !usedLegacy.has(f.id)),
    unmatchedRebuilt: rebuilt.fields.filter((f) => !usedRebuilt.has(f.id)),
  };
}
