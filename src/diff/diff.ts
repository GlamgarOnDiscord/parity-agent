import type { ScreenMatch } from "../fields/match";
import { labelTokens, normalizeValue } from "../fields/normalize";
import type { Field } from "../fields/types";
import type { Decision } from "./decisions";

/** `accepted`: different, and a person decided the rebuild may differ here (see decisions.ts). */
export type FieldVerdict = "equal" | "different" | "masked" | "accepted";

export interface FieldDiff {
  legacy: Field;
  rebuilt: Field;
  verdict: FieldVerdict;
  /** The canonical values that were compared (cents, ISO dates, folded text). */
  legacyValue: string;
  rebuiltValue: string;
  decision?: Decision;
}

export interface ScreenDiff {
  fields: FieldDiff[];
  /** Fields with no counterpart are reported, never silently dropped. */
  missingInRebuilt: Field[];
  extraInRebuilt: Field[];
  counts: {
    equal: number;
    different: number;
    masked: number;
    missing: number;
    extra: number;
    accepted: number;
  };
}

// `Total` masks every Total; `Total @ row-3` only the one in that group; `Total @ none` only the ungrouped one.
const volatileId = (label: string, group?: string) =>
  `${labelTokens(label).join(" ")}${group === undefined ? "" : ` @ ${group}`}`;
const isVolatile = (field: Field, volatile: Set<string>) =>
  volatile.has(volatileId(field.label)) || volatile.has(volatileId(field.label, field.group ?? "none"));

/** Compare matched fields by value, in plain code. Volatile fields are shown as masked, not hidden. */
export function diffScreens(match: ScreenMatch, volatileLabels: string[] = []): ScreenDiff {
  const volatile = new Set(
    volatileLabels.map((v) => {
      const at = v.lastIndexOf(" @ ");
      return at < 0 ? volatileId(v) : volatileId(v.slice(0, at), v.slice(at + 3));
    }),
  );
  const fields = match.matches.map((m): FieldDiff => {
    const kind = m.legacy.kind ?? m.rebuilt.kind;
    let a = normalizeValue(m.legacy.value, kind);
    let b = normalizeValue(m.rebuilt.value, kind);
    if (a.kind !== b.kind) {
      a = normalizeValue(m.legacy.value, "text");
      b = normalizeValue(m.rebuilt.value, "text");
    }
    const masked = isVolatile(m.legacy, volatile) || isVolatile(m.rebuilt, volatile);
    return {
      legacy: m.legacy,
      rebuilt: m.rebuilt,
      verdict: masked ? "masked" : a.value === b.value ? "equal" : "different",
      legacyValue: a.value,
      rebuiltValue: b.value,
    };
  });
  const missing = match.unmatchedLegacy.filter((f) => !isVolatile(f, volatile));
  const extra = match.unmatchedRebuilt.filter((f) => !isVolatile(f, volatile));
  const count = (v: FieldVerdict) => fields.filter((f) => f.verdict === v).length;
  return {
    fields,
    missingInRebuilt: missing,
    extraInRebuilt: extra,
    counts: {
      equal: count("equal"),
      different: count("different"),
      masked: count("masked"),
      missing: missing.length,
      extra: extra.length,
      accepted: 0,
    },
  };
}
