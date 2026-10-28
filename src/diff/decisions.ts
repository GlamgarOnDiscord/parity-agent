import { z } from "zod";
import { labelTokens } from "../fields/normalize";
import type { FieldDiff, ScreenDiff } from "./diff";

/**
 * A person's decision on one difference: the rebuild may differ from the legacy app here, for a reason they give.
 * It holds for these two values only; if either side shows anything else later, the difference is back.
 */
export const DecisionSchema = z.object({
  /** Checkpoint screen id in the proof. */
  screen: z.string().min(1).max(128),
  field: z.string().min(1).max(256),
  group: z.string().max(256).optional(),
  /** Canonical values compared (cents, ISO dates, folded text), as the diff computed them. */
  legacy: z.string().max(256),
  rebuilt: z.string().max(256),
  /** `legacy-bug`: the legacy app was wrong and the rebuild is right. `change`: a change of behaviour, on purpose. */
  kind: z.enum(["legacy-bug", "change"]),
  by: z.string().trim().min(1).max(80),
  why: z.string().trim().min(3).max(1000),
  at: z.string().max(40),
});

export type Decision = z.infer<typeof DecisionSchema>;

const sameField = (d: Pick<Decision, "field" | "group">, f: FieldDiff) =>
  labelTokens(d.field).join(" ") === labelTokens(f.legacy.label).join(" ") &&
  (d.group ?? null) === (f.legacy.group ?? null);

/** The decision that covers this field, if its values are still the ones the person saw. */
export function decisionFor(screen: string, f: FieldDiff, decisions: Decision[]): Decision | undefined {
  return decisions.find(
    (d) =>
      d.screen === screen && sameField(d, f) && d.legacy === f.legacyValue && d.rebuilt === f.rebuiltValue,
  );
}

/** Mark the differences a person accepted as accepted, and recount. Equal, noise and missing are untouched. */
export function applyDecisions(diff: ScreenDiff, screen: string, decisions: Decision[]): ScreenDiff {
  if (decisions.length === 0) return diff;
  const fields = diff.fields.map((f): FieldDiff => {
    if (f.verdict !== "different") return f;
    const decision = decisionFor(screen, f, decisions);
    return decision ? { ...f, verdict: "accepted", decision } : f;
  });
  const count = (v: FieldDiff["verdict"]) => fields.filter((f) => f.verdict === v).length;
  return {
    ...diff,
    fields,
    counts: { ...diff.counts, different: count("different"), accepted: count("accepted") },
  };
}

/** The same diff with every decision applied again from scratch, after one was added or revoked. */
export function reapplyDecisions(diff: ScreenDiff, screen: string, decisions: Decision[]): ScreenDiff {
  const fields = diff.fields.map((f): FieldDiff => {
    if (f.verdict !== "accepted") return f;
    const { decision: _, ...rest } = f;
    return { ...rest, verdict: "different" };
  });
  const reset = {
    ...diff,
    fields,
    counts: {
      ...diff.counts,
      different: fields.filter((f) => f.verdict === "different").length,
      accepted: 0,
    },
  };
  return applyDecisions(reset, screen, decisions);
}
