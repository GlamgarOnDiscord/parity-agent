import type { Capture } from "../capture/capture";
import type { Proof } from "../proof/schema";
import type { Rule } from "../rules/extract";

const PRICE_LIKE = /price|rate|cost/i;
const CODE_LIKE = /item|product|sku|code|article|ref/i;

/**
 * The specification Muse Code builds from: only what the capture showed and the expert accepted. Values are
 * quoted exactly as displayed, so formatting is part of the spec.
 */
export function writeSpec(c: Capture, proof: Proof, rules: Rule[]): string {
  const steps = proof.scenarios.flatMap((s) => s.steps);
  const inputs = [
    ...new Set(steps.filter((s) => s.do === "fill").map((s) => (s.do === "fill" ? s.field : ""))),
  ];
  const buttons = [
    ...new Set(steps.filter((s) => s.do === "click").map((s) => (s.do === "click" ? s.target : ""))),
  ];
  const checkpoint = proof.checkpoints.at(-1);
  const outputs = (checkpoint?.screen.fields ?? []).filter((f) => !inputs.includes(f.label));
  const title = checkpoint?.screen.title ?? c.frames[0]?.screen.title ?? "Screen";

  // Reference data the screens revealed, for example the unit price shown for an item code.
  const lookups = new Map<string, Set<string>>();
  for (const frame of c.frames) {
    const fields = frame.screen.fields;
    for (const key of fields.filter((f) => inputs.includes(f.label) && CODE_LIKE.test(f.label) && f.value)) {
      for (const val of fields.filter(
        (f) => PRICE_LIKE.test(f.label) && f.value && !inputs.includes(f.label),
      )) {
        const k = `${key.label} "${key.value}" -> ${val.label}`;
        if (!lookups.has(k)) lookups.set(k, new Set());
        lookups.get(k)?.add(val.value);
      }
    }
  }

  const lines: string[] = [
    "# SPEC",
    "",
    `One screen: **${title}**. Build it in \`public/\` following CONTRACT.md.`,
    "",
    "## Inputs (in this order)",
    "",
    ...inputs.map((l) => `- \`${l}\``),
    "",
    "## Buttons",
    "",
    ...buttons.map((b) => `- \`${b}\`: computes every displayed value below`),
    "",
    "## Displayed values",
    "",
    ...outputs.map((f) => `- \`${f.label}\`, shown like \`${f.value}\``),
    "",
    "## Business rules (accepted by the domain expert)",
    "",
  ];
  for (const r of rules) {
    lines.push(`- **${r.id} ${r.title}.** ${r.statement}`);
    if (r.target && r.expression)
      lines.push(`  - \`${r.target} = ${r.expression}\` (round(x, n) is half up)`);
  }
  if (lookups.size) {
    lines.push("", "## Reference data seen on screen", "");
    for (const [k, vals] of lookups) lines.push(`- ${k} ${[...vals].map((v) => `\`${v}\``).join(", ")}`);
  }
  lines.push("", "## Example that must match exactly", "");
  for (const s of steps) {
    if (s.do === "fill") lines.push(`- type \`${s.value}\` in \`${s.field}\``);
    if (s.do === "click") lines.push(`- press \`${s.target}\``);
  }
  if (checkpoint) {
    lines.push("- then the screen shows:");
    for (const f of checkpoint.screen.fields) lines.push(`  - \`${f.label}\` = \`${f.value}\``);
  }
  return `${lines.join("\n")}\n`;
}
