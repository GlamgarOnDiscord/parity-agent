import { z } from "zod";
import type { Capture } from "../capture/capture";
import { labelSimilarity } from "../fields/match";
import { labelTokens, normalizeValue } from "../fields/normalize";
import type { ModelClients } from "../models/types";
import { type Expr, evaluate, fieldsOf, parseExpr } from "./expr";

export interface RuleCheck {
  /** Frames where the expression reproduced the value on screen. */
  verified: number;
  contradicted: number;
  /** Frames where a referenced field was missing or not a number. */
  untestable: number;
  examples: { frame: number; expected: string; computed: string }[];
  error?: string;
}

export interface Rule {
  id: string;
  title: string;
  statement: string;
  kind: "computation" | "validation" | "workflow" | "format";
  target?: string;
  expression?: string;
  fields: string[];
  evidence: { frames: { index: number; t: number }[]; quotes: { text: string; start: number }[] };
  check?: RuleCheck;
  escalated: boolean;
  model: string;
  confidence: number;
}

const Proposed = z.object({
  rules: z
    .array(
      z.object({
        title: z.string().describe("A short name, for example 'QST on GST'"),
        statement: z.string().describe("The rule in plain business language, one or two sentences"),
        kind: z.enum(["computation", "validation", "workflow", "format"]),
        target: z
          .string()
          .nullable()
          .describe("For a computation: the label of the field it computes, else null"),
        expression: z
          .string()
          .nullable()
          .describe(
            "For a computation: the formula over field labels in braces, see the language above, else null",
          ),
        fields: z.array(z.string()).describe("Labels of the fields the rule involves"),
        evidenceFrames: z.array(z.number().int()).describe("Frame numbers that show the rule"),
        quotes: z.array(z.string()).describe("Narration copied word for word from the transcript, if any"),
        confidence: z.number().min(0).max(1),
      }),
    )
    .max(40),
});

const Revised = z.object({
  verdict: z.enum(["revised", "inconsistent"]),
  expression: z.string().nullable(),
  statement: z.string().nullable(),
  reason: z.string(),
});

const LANGUAGE = `Formula language: numbers, field labels in braces exactly as shown (for example {Sub Total}),
+ - * / and parentheses, round(x, digits) half up, min(a, b), max(a, b), abs(x), and sum({Label}) which adds
every field with that label on the screen (use it for totals over invoice lines). Nothing else.`;

function framesTable(c: Capture): string {
  return c.frames
    .map(
      (f, i) =>
        `Frame ${i + 1} (t=${f.t.toFixed(1)}s, ${f.screen.title ?? "screen"}): ` +
        f.screen.fields.map((x) => `${x.label} = ${x.value || "(empty)"}`).join("; "),
    )
    .join("\n");
}

function transcriptText(c: Capture): string {
  return c.transcript.map((l) => `[${l.start.toFixed(1)}s] ${l.text}`).join("\n") || "(no narration)";
}

/** Look a label up on one frame: exact first, then the closest label above 0.85 similarity. */
function valueOn(frame: Capture["frames"][number], label: string): number | undefined {
  const fields = frame.screen.fields;
  const field =
    fields.find((f) => f.label === label) ??
    fields
      .map((f) => ({ f, s: labelSimilarity(f.label, label) }))
      .filter((x) => x.s >= 0.85)
      .sort((a, b) => b.s - a.s)[0]?.f;
  if (!field || !field.value) return undefined;
  const n = normalizeValue(field.value);
  if (n.kind === "money") return Number(n.value) / 100;
  if (n.kind === "number" || n.kind === "percent") return Number(n.value);
  return undefined;
}

/**
 * Every numeric value shown under exactly this label on a frame (the lines of an invoice). Exact on purpose:
 * a sum over "Total price" must never pick up a "Price" column from another table.
 */
function allOn(frame: Capture["frames"][number], label: string): number[] {
  const wanted = labelTokens(label).join(" ");
  return frame.screen.fields
    .filter((f) => labelTokens(f.label).join(" ") === wanted)
    .map((f) => normalizeValue(f.value))
    .filter((n) => n.kind === "money" || n.kind === "number" || n.kind === "percent")
    .map((n) => (n.kind === "money" ? Number(n.value) / 100 : Number(n.value)));
}

/** Re-compute the target on every frame, in plain code. */
export function checkRule(c: Capture, target: string, expression: string): RuleCheck {
  let expr: Expr;
  try {
    expr = parseExpr(expression);
  } catch (error) {
    return { verified: 0, contradicted: 0, untestable: c.frames.length, examples: [], error: String(error) };
  }
  const check: RuleCheck = { verified: 0, contradicted: 0, untestable: 0, examples: [] };
  c.frames.forEach((frame, i) => {
    const expected = valueOn(frame, target);
    if (expected === undefined || fieldsOf(expr).some((l) => valueOn(frame, l) === undefined)) {
      check.untestable++;
      return;
    }
    let computed: number;
    try {
      computed = evaluate(
        expr,
        (l) => valueOn(frame, l),
        (l) => allOn(frame, l),
      );
    } catch {
      check.untestable++;
      return;
    }
    if (Math.abs(computed - expected) < 0.005) {
      check.verified++;
    } else {
      check.contradicted++;
      if (check.examples.length < 3) {
        check.examples.push({ frame: i + 1, expected: expected.toFixed(2), computed: computed.toFixed(4) });
      }
    }
  });
  return check;
}

/**
 * Propose rules with Muse Spark, then prove what can be proved: quotes must exist in the transcript, and every
 * formula is re-computed on every frame. A formula the screens contradict goes to Muse Wonder with the evidence.
 */
export async function extractRules(
  c: Capture,
  models: ModelClients,
  runId?: string,
  options: { wonder?: boolean } = {},
): Promise<Rule[]> {
  const prompt = `You are reading how a legacy business application behaves, from a screen recording.

Narration (what the user said, with times):
${transcriptText(c)}

Fields seen on each key frame:
${framesTable(c)}

Write the business rules this app follows: computations, validations, workflow and formatting. Use plain
business language a domain expert can confirm. For every computation, give the target field label and a formula.
${LANGUAGE}
Rules are general: they must hold for every transaction, not describe this one (no customer names, items or
quantities from the recording, no "the user typed"). Skip steps of the scenario that are not rules.
Prefer rules the frames or the narration actually show. Quotes must be copied word for word from the narration.`;

  const { value, call } = await models.structured.generate({
    schema: Proposed,
    prompt,
    runId,
    effort: "low",
    maxOutputTokens: 16000,
  });
  const transcript = c.transcript.map((l) => ({ ...l, lower: l.text.toLowerCase() }));
  const rules: Rule[] = [];

  for (const [i, p] of value.rules.entries()) {
    const quotes = p.quotes
      .map((q) => {
        const line = transcript.find((l) => q.trim() && l.lower.includes(q.trim().toLowerCase()));
        return line ? { text: q.trim(), start: line.start } : undefined;
      })
      .filter((q): q is { text: string; start: number } => q !== undefined);
    const rule: Rule = {
      id: `R-${String(i + 1).padStart(2, "0")}`,
      title: p.title,
      statement: p.statement,
      kind: p.kind,
      target: p.target ?? undefined,
      expression: p.expression ?? undefined,
      fields: p.fields,
      evidence: {
        frames: p.evidenceFrames
          .filter((n) => n >= 1 && n <= c.frames.length)
          .map((n) => ({ index: n, t: c.frames[n - 1]?.t ?? 0 })),
        quotes,
      },
      escalated: false,
      model: call.model,
      confidence: p.confidence,
    };
    if (p.kind === "computation" && p.target && p.expression)
      rule.check = checkRule(c, p.target, p.expression);
    rules.push(rule);
  }

  // Escalate contradicted formulas, at most MAX_ESCALATIONS, once every rule is known so a revision that
  // computes an input from one of its own outputs (circular) can be refused.
  let escalations = 0;
  for (const rule of rules) {
    if (!rule.target || !rule.expression || !rule.check) continue;
    if (rule.check.contradicted === 0 && !rule.check.error) continue;
    if (escalations++ >= MAX_ESCALATIONS) break;
    // Muse Spark settles contradictions by default; Muse Wonder (5x the output price) only when asked.
    const reviser = options.wonder ? models.hard : models.structured;
    const revised = await reviser
      .generate({
        schema: Revised,
        runId,
        effort: "medium",
        maxOutputTokens: 12000,
        prompt: `A proposed rule for a legacy business app does not match what its screens show.

Rule: ${rule.statement}
Target field: ${rule.target}
Formula: ${rule.expression}
${rule.check.error ? `The formula does not parse: ${rule.check.error}` : `Frames where it fails: ${JSON.stringify(rule.check.examples)}`}

Fields seen on each key frame:
${framesTable(c)}

Narration:
${transcriptText(c)}

Find the formula that reproduces the screens exactly (think about rounding: per line, per tax, or once at the
end), computed from the fields the target depends on, never from fields computed after it. Or say the evidence
is inconsistent. ${LANGUAGE}`,
      })
      .catch(() => null);
    if (!revised) {
      rule.escalated = true;
      continue;
    }
    rule.escalated = true;
    rule.model = `${rule.model} + ${revised.call.model}`;
    const expression = revised.value.expression;
    if (revised.value.verdict !== "revised" || !expression) continue;
    let parsed: Expr;
    try {
      parsed = parseExpr(expression);
    } catch {
      continue;
    }
    if (fieldsOf(parsed).some((f) => dependsOn(rules, f, rule.target ?? ""))) continue;
    const recheck = checkRule(c, rule.target, expression);
    if (recheck.verified > 0 && recheck.contradicted === 0 && !recheck.error) {
      rule.expression = expression;
      const statement = revised.value.statement;
      if (statement && !statement.includes("{")) rule.statement = statement;
      rule.check = recheck;
    }
  }
  return rules;
}

/** Revisions are paid calls: at most this many per extraction. */
const MAX_ESCALATIONS = 2;

/** True when `field` is computed, directly or not, from `target` by the other rules. */
function dependsOn(rules: Rule[], field: string, target: string, seen = new Set<string>()): boolean {
  if (labelSimilarity(field, target) >= 0.85) return true;
  if (seen.has(field)) return false;
  seen.add(field);
  const rule = rules.find((r) => r.target && r.expression && labelSimilarity(r.target, field) >= 0.85);
  if (!rule?.expression) return false;
  try {
    return fieldsOf(parseExpr(rule.expression)).some((f) => dependsOn(rules, f, target, seen));
  } catch {
    return false;
  }
}
