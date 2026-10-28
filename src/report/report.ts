import type { Coverage } from "../coverage/coverage";
import type { FieldDiff } from "../diff/diff";
import type { DataUrl } from "../models/types";
import type { Proof } from "../proof/schema";
import type { ProveResult } from "../replay/prove";
import type { StoredRule } from "../rules/store";

export interface ReportInput {
  proof: Proof;
  result: ProveResult;
  /** What was proved: an app directory or a URL. */
  candidate: string;
  rules: StoredRule[];
  coverage?: Coverage;
  calls: { calls: number; costUsd: number; sentBytes: number };
  /** Reference evidence per checkpoint screen id, for example the key frame of the recording. */
  legacyImages: Record<string, DataUrl>;
  /** Candidate screenshots per `scenario:step`. */
  rebuiltImages: Record<string, DataUrl>;
  proofSha256: string;
  parityVersion: string;
  generatedAt: Date;
}

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
// The whole string is checked, not only its prefix: images go into a CSS url(), which a quote or `)` would escape.
const isPng = (src: string | undefined): src is string =>
  src !== undefined && /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(src);
const plural = (n: number, one: string) => `${n} ${n === 1 ? one : `${one}s`}`;

type Box = { x: number; y: number; w: number; h: number };

/** Width and height from the PNG header, to keep a crop's proportions. */
function pngSize(src: string): { w: number; h: number } | undefined {
  const start = "data:image/png;base64,".length;
  const head = Buffer.from(src.slice(start, start + 44), "base64");
  return head.length >= 24 ? { w: head.readUInt32BE(16), h: head.readUInt32BE(20) } : undefined;
}

/**
 * The field and what sits to its left (usually its label), zoomed from the full screen with CSS only. Falls back
 * to the whole screen when the field has no box.
 */
function zoom(src: string, box: Box | undefined, caption: string) {
  const size = pngSize(src);
  const full = `<details><summary>Full screen</summary><img src="${src}" alt="${esc(caption)}"></details>`;
  if (!box || !size) {
    return `<figure><img src="${src}" alt="${esc(caption)}"><figcaption>${esc(caption)}</figcaption></figure>`;
  }
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  const x0 = clamp(box.x - 0.22);
  const x1 = clamp(box.x + box.w + 0.06);
  const y0 = clamp(box.y - 0.05);
  const y1 = clamp(box.y + box.h + 0.05);
  const cw = Math.max(x1 - x0, 0.05);
  const ch = Math.max(y1 - y0, 0.03);
  const pos = (start: number, span: number) => (span >= 1 ? 0 : (start / (1 - span)) * 100);
  const style = [
    `background-image:url(${src})`,
    `background-size:${(100 / cw).toFixed(2)}% auto`,
    `background-position:${pos(x0, cw).toFixed(2)}% ${pos(y0, ch).toFixed(2)}%`,
    `aspect-ratio:${(cw * size.w).toFixed(0)} / ${(ch * size.h).toFixed(0)}`,
  ].join(";");
  return `<figure><div class="crop" role="img" aria-label="${esc(caption)}" style="${style}"></div>
<figcaption>${esc(caption)}</figcaption>${full}</figure>`;
}

/** Reference and candidate side by side, zoomed on the field; a missing reference image leaves the candidate. */
function shots(
  f: FieldDiff,
  reference: string | undefined,
  candidate: string | undefined,
  referenceApp: string,
) {
  const parts = [
    isPng(reference) ? zoom(reference, f.legacy.box, `Reference: ${referenceApp}`) : "",
    isPng(candidate) ? zoom(candidate, f.rebuilt.box, "Candidate") : "",
  ].filter(Boolean);
  return parts.length ? `<div class="shots">${parts.join("")}</div>` : "";
}

function fieldRow(f: FieldDiff) {
  return `<tr class="${f.verdict}"><td>${esc(f.legacy.label)}</td><td class="v">${esc(f.legacy.value)}</td>
<td>${esc(f.rebuilt.label)}</td><td class="v">${esc(f.rebuilt.value)}</td><td class="mark">${
    f.verdict === "masked" ? "noise" : f.verdict
  }</td></tr>`;
}

/**
 * The proof report: one printable page that a person reads and signs. Verdict first, then every difference with
 * the screens it comes from, then what was masked as noise, what the rules say, what was never tested and what
 * left the machine. Self-contained HTML: no font, script or image is fetched.
 */
export function renderReport(r: ReportInput): string {
  const totals = r.result.checkpoints.reduce(
    (t, c) => ({
      equal: t.equal + c.diff.counts.equal,
      different: t.different + c.diff.counts.different,
      masked: t.masked + c.diff.counts.masked,
      missing: t.missing + c.diff.counts.missing,
      accepted: t.accepted + (c.diff.counts.accepted ?? 0),
    }),
    { equal: 0, different: 0, masked: 0, missing: 0, accepted: 0 },
  );
  const compared = totals.equal + totals.different + totals.masked + totals.accepted;
  const verdict = r.result.equal
    ? totals.accepted
      ? `Parity, with ${plural(totals.accepted, "accepted difference")}`
      : "Parity"
    : `No parity: ${totals.different} ${totals.different === 1 ? "difference" : "differences"}${
        totals.missing ? `, ${totals.missing} missing` : ""
      }`;
  const scenarioName = (id: string) => r.proof.scenarios.find((s) => s.id === id)?.name ?? id;
  const accepted = r.rules.filter((x) => x.status === "accepted").length;
  const pending = r.rules.filter((x) => x.status === "pending").length;

  const differences = r.result.checkpoints.flatMap((c) => [
    ...c.diff.fields
      .filter((f) => f.verdict === "different")
      .map(
        (f) => `<article class="diff">
  <h3>${esc(f.legacy.label)} <span>${esc(scenarioName(c.scenario))}, step ${c.step}</span></h3>
  <p class="values"><span class="before">${esc(f.legacy.value)}</span> before, <span class="after">${esc(
    f.rebuilt.value,
  )}</span> after.</p>
  <p class="canon">Compared as ${esc(f.legacyValue)} and ${esc(f.rebuiltValue)}.</p>
  ${shots(f, r.legacyImages[c.screen], r.rebuiltImages[`${c.scenario}:${c.step}`], r.proof.reference.app)}
</article>`,
      ),
    ...c.diff.missingInRebuilt.map(
      (
        f,
      ) => `<article class="diff"><h3>${esc(f.label)} <span>${esc(scenarioName(c.scenario))}, step ${c.step}</span></h3>
  <p class="values"><span class="before">${esc(f.value)}</span> before, no such field after.</p></article>`,
    ),
  ]);

  const kinds = { "legacy-bug": "the legacy app was wrong", change: "a change on purpose" };
  const acceptedDiffs = r.result.checkpoints.flatMap((c) =>
    c.diff.fields
      .filter((f) => f.verdict === "accepted" && f.decision)
      .map((f) => {
        const d = f.decision as NonNullable<FieldDiff["decision"]>;
        return `<article class="diff accepted">
  <h3>${esc(f.legacy.label)} <span>${esc(scenarioName(c.scenario))}, step ${c.step}</span></h3>
  <p class="values"><span class="before">${esc(f.legacy.value)}</span> before, <span class="after">${esc(
    f.rebuilt.value,
  )}</span> after: ${esc(kinds[d.kind])}.</p>
  <p class="why">&ldquo;${esc(d.why)}&rdquo; ${esc(d.by)}, ${esc(d.at.slice(0, 10))}</p>
</article>`;
      }),
  );

  const checkpoints = r.result.checkpoints
    .map(
      (
        c,
      ) => `<section class="cp"><h3>${esc(scenarioName(c.scenario))}, step ${c.step} <span>${c.diff.counts.equal} equal, ${
        c.diff.counts.different
      } different, ${c.diff.counts.masked} noise</span></h3>
<table><thead><tr><th>Reference field</th><th>Value</th><th>Candidate field</th><th>Value</th><th></th></tr></thead>
<tbody>${c.diff.fields.map(fieldRow).join("")}</tbody></table></section>`,
    )
    .join("");

  const rules = r.rules
    .map(
      (x) =>
        `<tr><td class="id">${esc(x.id)}</td><td><strong>${esc(x.title)}</strong> ${esc(x.statement)}${
          x.expression ? `<code>${esc(x.target)} = ${esc(x.expression)}</code>` : ""
        }</td><td>${x.check ? `${x.check.verified} verified, ${x.check.contradicted} contradicted` : ""}</td><td>${esc(
          x.status,
        )}</td></tr>`,
    )
    .join("");

  const gaps = r.coverage?.rows.filter((x) => x.state === "seen").map((x) => esc(x.label)) ?? [];

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Parity proof report</title>
<style>
  :root { --paper: #fbfbf9; --ink: #0b0d12; --soft: #5b6070; --line: #dcdde2; --blue: #2a4bff;
    --equal: #1f7a3f; --diff: #b42318; --noise: #8a5a00; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--paper); color: var(--ink);
    font: 13px/1.5 Geist, "Segoe UI", ui-sans-serif, system-ui, sans-serif; }
  main { max-width: 820px; margin: 0 auto; padding: 40px 32px 64px; }
  .mono, .v, code, .id, .meta dd { font-family: "Geist Mono", ui-monospace, "Cascadia Mono", Consolas, monospace; }
  header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid var(--ink);
    padding-bottom: 10px; }
  .brand { font-weight: 700; letter-spacing: -0.01em; font-size: 15px; }
  .brand i { display: inline-block; width: 6px; height: 6px; background: var(--blue); margin-left: 3px; }
  header p { margin: 0; color: var(--soft); }
  .verdict { margin: 28px 0 6px; font-size: 34px; line-height: 1.1; font-weight: 700; letter-spacing: -0.02em; }
  .verdict.ok { color: var(--equal); } .verdict.ko { color: var(--diff); }
  .lede { margin: 0 0 22px; color: var(--soft); font-size: 14px; }
  .meta { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line); margin: 0 0 28px; }
  .meta div { padding: 10px 12px 10px 0; } .meta dt { color: var(--soft); font-size: 11px; text-transform: uppercase;
    letter-spacing: 0.06em; } .meta dd { margin: 2px 0 0; font-size: 18px; }
  h2 { font-size: 15px; margin: 30px 0 10px; padding-top: 10px; border-top: 1px solid var(--line); }
  h3 { font-size: 13px; margin: 0 0 6px; } h3 span { color: var(--soft); font-weight: 400; margin-left: 6px; }
  .diff { border: 1px solid var(--diff); border-left-width: 4px; padding: 12px 14px; margin: 0 0 12px; break-inside: avoid; }
  .values { font-size: 16px; margin: 0; } .before, .after { font-family: "Geist Mono", ui-monospace, monospace; font-weight: 700; }
  .after { color: var(--diff); } .canon { color: var(--soft); margin: 2px 0 10px; }
  .shots { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  figure { margin: 0; } figure img, .crop { width: 100%; border: 1px solid var(--line); display: block; }
  .crop { background-repeat: no-repeat; image-rendering: auto; }
  details { margin-top: 4px; font-size: 11px; color: var(--soft); } details img { margin-top: 4px; }
  @media print { details { display: none; } }
  figcaption { color: var(--soft); font-size: 11px; margin-top: 3px; }
  table { width: 100%; border-collapse: collapse; margin: 0 0 14px; }
  th { text-align: left; font-weight: 500; color: var(--soft); font-size: 11px; border-bottom: 1px solid var(--ink); padding: 4px 6px; }
  td { padding: 4px 6px; border-bottom: 1px solid var(--line); vertical-align: top; }
  tr.different td { color: var(--diff); font-weight: 600; } tr.masked td { color: var(--noise); }
  tr.accepted td { color: var(--blue); } .diff.accepted { border-left-color: var(--blue); }
  .diff.accepted .after { color: var(--blue); } p.why { margin: 4px 0 0; color: var(--soft); }
  td.mark { font-size: 11px; color: var(--soft); text-align: right; } tr.different td.mark { color: var(--diff); }
  .cp { break-inside: avoid; } code { display: block; margin-top: 3px; font-size: 12px; color: var(--soft); }
  .id { color: var(--soft); white-space: nowrap; }
  p.note { color: var(--soft); margin: 0 0 8px; }
  .sign { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 24px; margin-top: 18px; break-inside: avoid; }
  .sign div { border-top: 1px solid var(--ink); padding-top: 4px; color: var(--soft); font-size: 11px; height: 54px; }
  .integrity dd { font-size: 11px; word-break: break-all; }
  .integrity { display: grid; grid-template-columns: max-content 1fr; gap: 2px 14px; margin: 0; }
  .integrity dt { color: var(--soft); }
  @page { size: A4; margin: 14mm; }
  @media print { main { padding: 0; } body { background: #fff; } }
  @media (max-width: 640px) { .meta { grid-template-columns: repeat(2, 1fr); } .shots, .sign { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<main>
<header><span class="brand">Parity<i></i></span><p>Proof report, ${esc(r.generatedAt.toISOString().slice(0, 16).replace("T", " "))} UTC</p></header>

<p class="verdict ${r.result.equal ? "ok" : "ko"}">${esc(verdict)}</p>
<p class="lede">${esc(r.proof.reference.app)} (reference, from ${esc(r.proof.reference.source)}) against ${esc(
    r.candidate,
  )}. ${plural(compared, "field")} compared over ${plural(r.result.checkpoints.length, "checkpoint")}, replayed twice. The comparison is plain code; no model judged equality.</p>

<dl class="meta">
  <div><dt>Equal</dt><dd>${totals.equal}</dd></div>
  <div><dt>Different</dt><dd>${totals.different}</dd></div>
  <div><dt>Noise, masked</dt><dd>${totals.masked}</dd></div>
  <div><dt>Missing</dt><dd>${totals.missing}</dd></div>
  ${totals.accepted ? `<div><dt>Accepted</dt><dd>${totals.accepted}</dd></div>` : ""}
</dl>

${differences.length ? `<h2>Differences</h2>${differences.join("")}` : `<h2>Differences</h2><p class="note">None. Every compared field has the same value in both apps.</p>`}

${
  acceptedDiffs.length
    ? `<h2>Accepted differences</h2><p class="note">Differences a person decided the rebuild may keep, with who and why. Each holds for these two values only.</p>${acceptedDiffs.join("")}`
    : ""
}

<h2>Checkpoints</h2>
${checkpoints}

<h2>Noise</h2>
<p class="note">${
    r.result.volatile.length
      ? `Fields that changed between two runs of the same app, so they are shown but not compared: ${r.result.volatile.map(esc).join(", ")}.`
      : "No field changed between two runs of the same app."
  }</p>

${
  r.rules.length
    ? `<h2>Business rules</h2><p class="note">${accepted} accepted by the domain expert, ${pending} waiting. Formulas are checked against the recorded values by code.</p>
<table><tbody>${rules}</tbody></table>`
    : ""
}

${
  r.coverage
    ? `<h2>Coverage</h2><p class="note">${r.coverage.counts.tested} fields checked by this proof, ${r.coverage.counts.ruled} explained by a rule only, ${
        r.coverage.counts.seen
      } seen in the recording and never tested${gaps.length ? `: ${gaps.join(", ")}` : ""}.</p>`
    : ""
}

<h2>What left this machine</h2>
<p class="note">${plural(r.calls.calls, "model call")} for this run, ${(r.calls.sentBytes / 1e6).toFixed(2)} MB sent, $${r.calls.costUsd.toFixed(
    3,
  )}. Replays, matching and the diff ran locally and sent nothing.</p>

<h2>Integrity</h2>
<dl class="integrity"><dt>Proof SHA-256</dt><dd class="mono">${esc(r.proofSha256)}</dd>
<dt>Parity</dt><dd class="mono">${esc(r.parityVersion)}</dd><dt>Candidate</dt><dd class="mono">${esc(r.candidate)}</dd></dl>

<h2>Sign-off</h2>
<p class="note">I have read the differences and the noise above.</p>
<div class="sign"><div>Name and role</div><div>Date</div><div>Accept / Reject</div></div>
</main>
</body>
</html>
`;
}
