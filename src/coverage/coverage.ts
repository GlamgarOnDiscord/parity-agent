import type { Capture } from "../capture/capture";
import type { Proof } from "../proof/schema";
import type { Rule } from "../rules/extract";

/**
 * - tested: a checkpoint of the proof compares it, so any change breaks the proof
 * - ruled: an accepted or pending rule computes or reads it, but no checkpoint compares it
 * - seen: it only appeared in the recording; nothing protects it
 */
export type CoverageState = "tested" | "ruled" | "seen";

export interface CoverageRow {
  label: string;
  state: CoverageState;
  /** Frames of the recording where it appeared. */
  frames: number[];
  rules: string[];
  checkpoints: number;
}

export interface Coverage {
  rows: CoverageRow[];
  counts: Record<CoverageState, number>;
}

const key = (label: string) =>
  label
    .replace(/[\s:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/** What the recording showed, what rules explain and what the proof checks, field by field. Deterministic. */
export function coverageOf(capture: Capture, proof: Proof, rules: Rule[]): Coverage {
  const rows = new Map<string, CoverageRow>();
  const row = (label: string) => {
    const k = key(label);
    if (!k) return undefined;
    let r = rows.get(k);
    if (!r) {
      r = {
        label: label.replace(/[\s:]+$/g, "").trim(),
        state: "seen",
        frames: [],
        rules: [],
        checkpoints: 0,
      };
      rows.set(k, r);
    }
    return r;
  };

  capture.frames.forEach((frame, i) => {
    for (const f of frame.screen.fields) {
      const r = row(f.label);
      if (r && !r.frames.includes(i + 1)) r.frames.push(i + 1);
    }
  });
  for (const rule of rules) {
    for (const label of new Set([...(rule.target ? [rule.target] : []), ...rule.fields])) {
      const r = row(label);
      if (r && !r.rules.includes(rule.id)) r.rules.push(rule.id);
    }
  }
  for (const c of proof.checkpoints) {
    for (const f of c.screen.fields) {
      const r = row(f.label);
      if (r) r.checkpoints++;
    }
  }

  const counts: Record<CoverageState, number> = { tested: 0, ruled: 0, seen: 0 };
  const order: Record<CoverageState, number> = { seen: 0, ruled: 1, tested: 2 };
  for (const r of rows.values()) {
    r.state = r.checkpoints > 0 ? "tested" : r.rules.length > 0 ? "ruled" : "seen";
    counts[r.state]++;
  }
  // Gaps first: what nothing protects is what the reviewer must look at.
  const sorted = [...rows.values()].sort(
    (a, b) => order[a.state] - order[b.state] || a.label.localeCompare(b.label),
  );
  return { rows: sorted, counts };
}

/** Scenarios written by `explore --save`, not by a person or a recording. */
export const isExplored = (scenario: string) => scenario.startsWith("explored-");

export interface Explored {
  /** Scenarios of the proof that exploration wrote. */
  scenarios: number;
  /** Checkpoints of those scenarios: screens a replay now compares because exploration found them. */
  screens: number;
  /** Labels only those checkpoints compare, and that the recording, if any, never showed. */
  fields: string[];
}

/** What exploration added to the proof. Deterministic, read from the proof alone (and the recording, if any). */
export function exploredOf(proof: Proof, capture?: Capture): Explored {
  const recorded = new Set(capture?.frames.flatMap((f) => f.screen.fields.map((x) => key(x.label))) ?? []);
  const elsewhere = new Set(
    proof.checkpoints
      .filter((c) => !isExplored(c.scenario))
      .flatMap((c) => c.screen.fields.map((f) => key(f.label))),
  );
  const ours = proof.checkpoints.filter((c) => isExplored(c.scenario));
  const fields = new Map<string, string>();
  for (const c of ours) {
    for (const f of c.screen.fields) {
      const k = key(f.label);
      if (k && !recorded.has(k) && !elsewhere.has(k) && !fields.has(k))
        fields.set(k, f.label.replace(/[\s:]+$/g, "").trim());
    }
  }
  return {
    scenarios: proof.scenarios.filter((s) => isExplored(s.id)).length,
    screens: ours.length,
    fields: [...fields.values()].sort((a, b) => a.localeCompare(b)),
  };
}
