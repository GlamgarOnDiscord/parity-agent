import type { ProveResult } from "../replay/prove";

/** Text from an app goes into Markdown: keep it on one line and out of table and link syntax. */
const cell = (s: string) => s.replace(/[\r\n\u2028\u2029]+/g, " ").replace(/[|`*_[\]<>\\]/g, (c) => `\\${c}`);

/**
 * The verdict in Markdown, for a pull request comment or a CI step summary: the line a reviewer reads first, then
 * every difference with both values, then the counts. Plain text from the proof only; no link, no image.
 */
export function summaryOf(reference: string, candidate: string, result: ProveResult): string {
  const counts = result.checkpoints.reduce(
    (t, c) => ({
      equal: t.equal + c.diff.counts.equal,
      different: t.different + c.diff.counts.different,
      masked: t.masked + c.diff.counts.masked,
      missing: t.missing + c.diff.counts.missing,
    }),
    { equal: 0, different: 0, masked: 0, missing: 0 },
  );
  const failing = counts.different + counts.missing;
  const lines = [
    failing === 0
      ? `### Parity: every field matches`
      : `### No parity: ${failing} ${failing === 1 ? "field differs" : "fields differ"}`,
    "",
    `${cell(reference)} against \`${cell(candidate).replace(/`/g, "")}\`. ${counts.equal} equal, ${counts.different} different, ${counts.masked} noise, ${counts.missing} missing, over ${result.checkpoints.length} ${result.checkpoints.length === 1 ? "checkpoint" : "checkpoints"} replayed twice. The comparison is plain code; no model judged equality.`,
  ];
  const rows = result.checkpoints.flatMap((c) => [
    ...c.diff.fields
      .filter((f) => f.verdict === "different")
      .map(
        (f) =>
          `| ${cell(f.legacy.label)} | ${cell(c.scenario)}, step ${c.step} | ${cell(f.legacy.value)} | ${cell(f.rebuilt.value)} |`,
      ),
    ...c.diff.missingInRebuilt.map(
      (f) => `| ${cell(f.label)} | ${cell(c.scenario)}, step ${c.step} | ${cell(f.value)} | missing |`,
    ),
  ]);
  if (rows.length) lines.push("", "| Field | Where | Before | After |", "| --- | --- | --- | --- |", ...rows);
  const accepted = result.checkpoints.flatMap((c) =>
    c.diff.fields
      .filter((f) => f.verdict === "accepted" && f.decision)
      .map(
        (f) =>
          `| ${cell(f.legacy.label)} | ${cell(f.legacy.value)} | ${cell(f.rebuilt.value)} | ${cell(f.decision?.by ?? "")}: ${cell(f.decision?.why ?? "")} |`,
      ),
  );
  if (accepted.length)
    lines.push(
      "",
      "Accepted on purpose:",
      "",
      "| Field | Before | After | Decided by |",
      "| --- | --- | --- | --- |",
      ...accepted,
    );
  if (result.volatile.length) lines.push("", `Noise masked: ${result.volatile.map(cell).join(", ")}.`);
  return `${lines.join("\n")}\n`;
}
