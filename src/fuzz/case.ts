import { z } from "zod";
import { AdapterSchema, type Scenario, ScenarioSchema } from "../proof/schema";

const Text = z.string().max(256);

/** One input of a line: a value picked from a list, or an integer in a range. Optional inputs may be left out. */
export const FuzzInputSchema = z.union([
  z.object({
    field: Text,
    oneOf: z.array(Text).min(1).max(100),
    optional: z.number().min(0).max(1).optional(),
  }),
  z.object({
    field: Text,
    int: z.tuple([z.number().int(), z.number().int()]).refine(([lo, hi]) => lo <= hi, "int range is lo, hi"),
    optional: z.number().min(0).max(1).optional(),
  }),
]);

/**
 * How to generate cases for a screen that takes repeated lines, like an invoice: the inputs of one line, the
 * button that adds it, and how many lines. The first value of a list and the low end of a range are the simplest,
 * which is where shrinking goes.
 */
export const FuzzSpecSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9-]{1,40}$/)
    .max(40),
  name: Text,
  open: Text.regex(/^\/(?![/\\])[^\\]*$/).default("/"),
  line: z.array(FuzzInputSchema).min(1).max(20),
  add: Text,
  lines: z
    .tuple([z.number().int().min(1), z.number().int().max(50)])
    .refine(([lo, hi]) => lo <= hi)
    .default([1, 4]),
  reference: z.object({ adapter: AdapterSchema.optional() }).optional(),
});

export type FuzzInput = z.infer<typeof FuzzInputSchema>;
export type FuzzSpec = z.infer<typeof FuzzSpecSchema>;
/** One line of a case: the value typed in each input, in the spec's order; `null` leaves an optional input out. */
export type Line = (string | null)[];
export type Case = Line[];

/** Mulberry32: small, fast and the same on every machine for a given seed. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rand: () => number, lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));

function draw(input: FuzzInput, rand: () => number): string | null {
  if (input.optional !== undefined && rand() >= input.optional) return null;
  if ("oneOf" in input) return input.oneOf[pick(rand, 0, input.oneOf.length - 1)] as string;
  // Small numbers are where most rules live; large ones find formatting. Half of the draws stay under 10.
  const [lo, hi] = input.int;
  return String(rand() < 0.5 ? pick(rand, lo, Math.min(hi, lo + 9)) : pick(rand, lo, hi));
}

export function generateCase(spec: FuzzSpec, rand: () => number): Case {
  const n = pick(rand, spec.lines[0], spec.lines[1]);
  return Array.from({ length: n }, () => spec.line.map((input) => draw(input, rand)));
}

/** The case as a scenario both apps can replay: open the screen, enter every line, check once at the end. */
export function caseScenario(spec: FuzzSpec, c: Case, id: string, name?: string): Scenario {
  const steps: Scenario["steps"] = [{ do: "open", path: spec.open }];
  for (const line of c) {
    spec.line.forEach((input, i) => {
      const value = line[i];
      if (value !== null && value !== undefined) steps.push({ do: "fill", field: input.field, value });
    });
    steps.push({ do: "click", target: spec.add });
  }
  steps.push({ do: "check", screen: id, note: describeCase(spec, c) });
  return ScenarioSchema.parse({ id, name: name ?? `${spec.name}, ${id}`, steps });
}

export function describeCase(spec: FuzzSpec, c: Case): string {
  return c
    .map((line) =>
      spec.line
        .map((input, i) => (line[i] === null ? null : `${input.field} ${line[i]}`))
        .filter(Boolean)
        .join(", "),
    )
    .join(" | ");
}

/**
 * Reduce a failing case to a smaller one that still fails: drop lines, leave optional inputs out, then move each
 * value toward the simplest one. Every case kept was seen failing, so the result always reproduces.
 */
export async function shrink(
  spec: FuzzSpec,
  failing: Case,
  fails: (c: Case) => Promise<boolean>,
  maxTries = 60,
): Promise<{ case: Case; tries: number }> {
  let best = failing.map((l) => [...l]);
  let tries = 0;
  const seen = new Map<string, boolean>();
  const attempt = async (c: Case) => {
    const key = JSON.stringify(c);
    const known = seen.get(key);
    if (known !== undefined) return known;
    if (tries >= maxTries) return false;
    tries++;
    const result = await fails(c);
    seen.set(key, result);
    if (result) best = c;
    return result;
  };

  // Lines first: the biggest cut. Removing one may let another go too, so loop until nothing more can go.
  for (let changed = true; changed && best.length > spec.lines[0]; ) {
    changed = false;
    for (let i = best.length - 1; i >= 0 && best.length > spec.lines[0]; i--) {
      if (await attempt(best.filter((_, j) => j !== i))) changed = true;
    }
  }

  const withValue = (c: Case, li: number, ii: number, v: string | null): Case =>
    c.map((line, j) => (j === li ? line.map((x, k) => (k === ii ? v : x)) : line));

  for (let li = 0; li < best.length; li++) {
    for (const [ii, input] of spec.line.entries()) {
      const current = best[li]?.[ii];
      if (current === null || current === undefined) continue;
      if (input.optional !== undefined && (await attempt(withValue(best, li, ii, null)))) continue;
      if ("oneOf" in input) {
        const at = input.oneOf.indexOf(current);
        for (let k = 0; k < (at < 0 ? input.oneOf.length : at); k++) {
          if (await attempt(withValue(best, li, ii, input.oneOf[k] as string))) break;
        }
      } else {
        // Binary search toward the low end; `hi` only ever holds a value seen failing.
        let lo = input.int[0];
        let hi = Number(current);
        while (lo < hi) {
          const mid = Math.floor((lo + hi) / 2);
          if (await attempt(withValue(best, li, ii, String(mid)))) hi = mid;
          else lo = mid + 1;
        }
      }
    }
  }
  return { case: best, tries };
}

/**
 * Cases next to a failing one: each value moved a little (the next integer, twice, ten times, another item), one
 * at a time. A rounding rule shows in the pattern of values around a difference, not in one of them.
 */
export function around(spec: FuzzSpec, c: Case, max = 8): Case[] {
  const variants: Case[][] = [];
  for (const [li, line] of c.entries()) {
    for (const [ii, input] of spec.line.entries()) {
      const current = line[ii];
      if (current === null || current === undefined) continue;
      let values: string[];
      if ("oneOf" in input) values = input.oneOf.filter((v) => v !== current).slice(0, 3);
      else {
        const n = Number(current);
        const [lo, hi] = input.int;
        values = [n + 1, n * 2, n * 10, n + 7, lo].filter((v) => v >= lo && v <= hi && v !== n).map(String);
      }
      variants.push(values.map((v) => c.map((l, j) => (j === li ? l.map((x, k) => (k === ii ? v : x)) : l))));
    }
  }
  const out: Case[] = [];
  const seen = new Set([JSON.stringify(c)]);
  for (let round = 0; out.length < max && variants.some((v) => v.length > round); round++) {
    for (const v of variants) {
      const next = v[round];
      if (!next || out.length >= max || seen.has(JSON.stringify(next))) continue;
      seen.add(JSON.stringify(next));
      out.push(next);
    }
  }
  return out;
}
