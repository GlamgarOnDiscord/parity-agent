import { type Coverage, type Explored, isExplored } from "../coverage/coverage";
import type { FieldDiff } from "../diff/diff";
import type { Proof } from "../proof/schema";
import type { HistoryEntry } from "../rebuild/history";
import type { ProveResult } from "../replay/prove";
import type { RepairStatus } from "./repair";
import { esc, icon, shell, ticks } from "./ui";

/** What `bun run report` leaves in runs/<run>/result.json for this screen. */
export interface SavedResult {
  result: ProveResult;
  candidate: string;
  at: string;
  /** Candidate screenshot file names under runs/<run>/evidence, by `scenario:step`. */
  evidence: Record<string, string>;
  /** Reference app screenshots under runs/<run>/evidence, when the reference was replayed rather than recorded. */
  reference?: Record<string, string>;
  /** How the report was run, so a repair from this screen can replay the same way. */
  replay?: { app?: string; url?: string; referenceUrl?: string };
}

export interface DiffInput {
  run: string;
  proof: Proof;
  saved?: SavedResult;
  coverage?: Coverage;
  /** What exploration added to the proof: scenarios, screens, fields no recording showed. */
  explored?: Explored;
  calls: { calls: number; costUsd: number; sentBytes: number };
  /** PARITY_BUDGET_USD, the cap every model call is checked against. */
  budgetUsd: number;
  /** Every proof of the app during rebuilds and repairs of this run, oldest first. */
  history?: HistoryEntry[];
  /** Whether this server can start a repair, and the one running or last finished for this run. */
  repair?: { available: boolean; status?: RepairStatus };
  exploration?: {
    steps: number;
    costUsd: number;
    found: { step: number; title: string; location: string; labels: string[] }[];
  };
}

type Box = NonNullable<FieldDiff["legacy"]["box"]>;

const CSS = `
.page { padding: 26px 28px 56px; display: grid; gap: 18px; max-width: 1360px; }
.page > *, .split > *, .col > * { min-width: 0; }
h1 { font-size: 22px; font-weight: 600; letter-spacing: -0.01em; margin: 0; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.lede { color: var(--t2); margin: 4px 0 0; max-width: 90ch; }
.verdict { display: inline-flex; align-items: center; gap: 8px; font: 600 13px var(--mono); padding: 4px 10px; border-radius: 999px; }
.verdict.ok { background: rgba(34, 197, 94, .12); color: #86efac; } .verdict.bad { background: rgba(239, 68, 68, .14); color: #fca5a5; }
.meters { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.meter { padding: 16px 18px; display: grid; gap: 10px; align-content: start; }
.meter header { display: flex; justify-content: space-between; color: var(--t2); }
.meter .big { font: 500 28px/1 var(--mono); letter-spacing: -0.02em; }
.meter .big small { font-size: 14px; color: var(--t3); margin-left: 6px; }
.meter p { margin: 0; color: var(--t3); font-size: 12px; }
.meter p b { color: var(--t2); font-weight: 500; }
.col { display: grid; gap: 14px; align-content: start; }
.split { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px; align-items: start; }
.panel header { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid var(--line); flex-wrap: wrap; }
.panel header h2 { font-size: 14px; font-weight: 600; margin: 0; } .panel header .meta { color: var(--t3); font: 12px var(--mono); margin-left: auto; }
.panel .body { padding: 14px 18px 16px; display: grid; gap: 14px; }
.row { display: grid; gap: 6px; } .row .h { display: flex; justify-content: space-between; gap: 12px; font: 12px var(--mono); }
.row .h b { font-weight: 500; color: var(--t1); font-family: Geist, system-ui, sans-serif; font-size: 13px; }
.legend { display: flex; gap: 14px; flex-wrap: wrap; color: var(--t3); font: 11px var(--mono); }
.legend i { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 6px; vertical-align: -1px; }
.legend i.gap { box-shadow: inset 0 0 0 1px var(--t3); }
.fields, .moved { list-style: none; margin: 0; padding: 0; display: grid; }
.fields li { display: grid; grid-template-columns: 1fr auto auto; gap: 12px; align-items: center; padding: 7px 0; border-bottom: 1px solid var(--line); }
.fields li:last-child, .moved li:last-child { border-bottom: 0; } .fields .f { color: var(--t3); font: 11px var(--mono); }
.moved li { display: grid; grid-template-columns: 1fr auto; gap: 2px 12px; padding: 8px 0; border-bottom: 1px solid var(--line); }
.moved .where { color: var(--t3); font-size: 12px; }
.moved .vals { font: 14px var(--mono); grid-row: span 2; align-self: center; white-space: nowrap; }
.moved .vals .after, .caption .after { color: #fca5a5; font-weight: 600; }
.none { color: var(--t2); margin: 0; }
.found { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.found li { display: grid; grid-template-columns: 28px 1fr; gap: 2px 10px; }
.found .n { font: 11px var(--mono); color: var(--t3); grid-row: span 2; padding-top: 2px; }
.found .l { grid-column: 2; color: var(--t3); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.seg { display: flex; background: var(--bg); border: 1px solid var(--line); border-radius: 8px; padding: 2px; }
.seg button { font: inherit; font-size: 12px; color: var(--t2); background: none; border: 0; padding: 4px 10px; border-radius: 6px; cursor: pointer; white-space: nowrap; }
.seg button[aria-pressed="true"] { background: var(--card-2); color: var(--t1); }
.compare { position: relative; background: #fff; border-radius: 10px; overflow: hidden; border: 1px solid var(--line-2); user-select: none; }
.compare .base { position: relative; aspect-ratio: 4 / 1; overflow: hidden; }
.compare .over { position: absolute; inset: 0; overflow: hidden; background: #fff; clip-path: inset(0 calc(100% - var(--x, 50%)) 0 0); }
.compare img { position: absolute; left: 0; width: 100%; height: auto; display: block; }
.hl { position: absolute; box-sizing: border-box; border: 2px solid var(--red); border-radius: 4px; box-shadow: 0 0 0 4px rgba(239, 68, 68, .22); pointer-events: none; }
.hl.same { border-color: var(--blue); box-shadow: 0 0 0 4px rgba(76, 111, 255, .22); }
.compare .bar { position: absolute; top: 0; bottom: 0; left: var(--x, 50%); width: 2px; margin-left: -1px; background: #0e0e10; pointer-events: none; }
.compare .knob { position: absolute; top: 50%; left: var(--x, 50%); width: 36px; height: 36px; margin: -18px 0 0 -18px; border-radius: 50%;
  background: #0e0e10; color: #fff; display: grid; place-items: center; pointer-events: none; border: 2px solid #fff; }
.compare input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: ew-resize; margin: 0; }
.compare:has(input:focus-visible) .knob { box-shadow: 0 0 0 3px var(--blue-hi); }
.compare .who { position: absolute; top: 12px; font: 600 12px Geist, system-ui, sans-serif; padding: 4px 10px; border-radius: 999px; pointer-events: none; background: #0e0e10; color: #fff; }
.compare .who.l { left: 12px; } .compare .who.r { right: 12px; }
.strips { display: grid; gap: 10px; }
.strips figure { margin: 0; display: grid; grid-template-columns: 72px 1fr; gap: 12px; align-items: center; }
.strips figcaption { font: 600 12px Geist, system-ui, sans-serif; color: var(--t2); }
.strip { position: relative; aspect-ratio: 6 / 1; background: #fff; border-radius: 8px; overflow: hidden; outline: 1px solid var(--line-2); outline-offset: -1px; }
.strip img { position: absolute; max-width: none; height: auto; }
.caption { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; flex-wrap: wrap; }
.caption .vals { font: 15px var(--mono); } .caption .note { color: var(--t2); }
.tablewrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 560px; }
th { text-align: left; font: 500 11px var(--mono); color: var(--t3); letter-spacing: .04em; padding: 8px 12px; border-bottom: 1px solid var(--line-2); white-space: nowrap; }
td { padding: 8px 12px; border-bottom: 1px solid var(--line); } tr:last-child td { border-bottom: 0; }
td.v { font-family: var(--mono); white-space: nowrap; } tr.different td { background: rgba(239, 68, 68, .06); } tr.different td.v { color: #fca5a5; }
tr.masked td.v { color: var(--t3); }
tr.accepted td.v { color: var(--blue-hi); }
.moved .act { grid-column: 1 / -1; }
.moved details summary { list-style: none; cursor: pointer; color: var(--t2); font-size: 12px; display: inline-flex; gap: 6px; align-items: center; }
.moved details summary::-webkit-details-marker { display: none; }
.moved details summary:hover { color: var(--t1); }
.decide { display: grid; gap: 10px; margin-top: 10px; padding: 12px; background: var(--bg); border: 1px solid var(--line); border-radius: 10px; }
.decide fieldset { border: 0; padding: 0; margin: 0; display: grid; gap: 6px; }
.decide legend { color: var(--t3); font-size: 12px; margin-bottom: 4px; }
.decide label { display: flex; gap: 8px; align-items: baseline; font-size: 13px; }
.decide input[type="text"], .decide textarea { font: inherit; color: var(--t1); background: var(--card); border: 1px solid var(--line-2); border-radius: 8px; padding: 7px 10px; width: 100%; box-sizing: border-box; }
.decide textarea { min-height: 64px; resize: vertical; }
.decide .err { color: #fca5a5; font-size: 12px; margin: 0; min-height: 1em; }
.accepted-list { list-style: none; margin: 0; padding: 0; display: grid; }
.accepted-list li { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; padding: 10px 0; border-bottom: 1px solid var(--line); }
.accepted-list li:last-child { border-bottom: 0; }
.accepted-list .vals { font: 14px var(--mono); white-space: nowrap; } .accepted-list .vals .after { color: var(--blue-hi); }
.accepted-list .why { color: var(--t2); font-size: 13px; } .accepted-list .by { color: var(--t3); font-size: 12px; }
.linkbtn { font: inherit; font-size: 12px; color: var(--t3); background: none; border: 0; padding: 0; cursor: pointer; text-decoration: underline; justify-self: end; }
.linkbtn:hover { color: var(--t1); }
.repair { display: grid; gap: 10px; }
.repair pre { margin: 0; max-height: 220px; overflow: auto; background: var(--bg); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; font: 12px/1.5 var(--mono); color: var(--t2); white-space: pre-wrap; }
.repair .state { display: flex; gap: 10px; align-items: center; color: var(--t2); }
.history { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.history li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 12px; }
.history .h { font: 12px var(--mono); color: var(--t3); } .history .h b { color: var(--t1); font: 500 13px Geist, system-ui, sans-serif; }
.history .n { font: 13px var(--mono); text-align: right; }
.history .ticks { grid-column: 1 / -1; }
@media (max-width: 1100px) { .meters, .split { grid-template-columns: 1fr; } }
@media (max-width: 640px) { .page { padding: 18px 16px 40px; } .top { flex-wrap: wrap; padding: 14px 16px; } .top .right { display: none; }
  .strips figure { grid-template-columns: 1fr; gap: 4px; } .panel header .meta { margin-left: 0; width: 100%; } }
`;

// Red belongs to differences only. A gap in coverage is shown as a gap, not as a failure.
const STATE = {
  tested: ["ok", "tested"],
  ruled: ["blue", "rule only"],
  seen: ["hollow", "never tested"],
} as const;

const pct = (n: number) => `${(n * 100).toFixed(2)}%`;
const sameish = (v: FieldDiff["verdict"]) => (v === "different" ? "" : " same");

/** The field outlined on a screen, in percentages of that screen or of a crop of it. */
function outline(
  b: Box | undefined,
  verdict: FieldDiff["verdict"],
  frame = { x: 0, y: 0, w: 1, h: 1 },
  pad = 0.006,
) {
  if (!b) return "";
  return `<span class="hl${sameish(verdict)}" style="left:${pct((b.x - pad - frame.x) / frame.w)};top:${pct(
    (b.y - pad * 1.6 - frame.y) / frame.h,
  )};width:${pct((b.w + pad * 2) / frame.w)};height:${pct((b.h + pad * 3.2) / frame.h)}"></span>`;
}

/**
 * A strip around one field at a scale shared by both apps (`ch`, the strip height as a share of the screen), so the
 * two values read at the same size. The field starts at 30% of the strip width, which keeps a label written right
 * before it and leaves out a label column further left; its bottom edge sits just under the field (old desktop
 * frames often end in a black border right below the status bar).
 */
function strip(src: string, b: Box, verdict: FieldDiff["verdict"], alt: string, ch: number) {
  const ASPECT = 6; // strip width / height
  const IMAGE = 16 / 10; // screens are captured at 1280x800
  const cw = (ch * ASPECT) / IMAGE;
  const frame = { x: b.x - cw * 0.3, y: Math.max(0, b.y + b.h + 0.003 - ch), w: cw, h: ch };
  const img = `<img src="${src}" alt="${esc(alt)}" style="width:${pct(1 / cw)};left:${pct(-frame.x / cw)};top:${pct(-frame.y / ch)}">`;
  // A field drawn as a wide block (a value cell) is outlined within the strip, not past its edge.
  const shown = { ...b, w: Math.min(b.w, cw * 0.66) };
  return `<div class="strip">${img}${outline(shown, verdict, frame, 0.0015)}</div>`;
}

/** The signature: one screen over the other, split by a knob, set by default between the two fields. */
function compare(f: FieldDiff, run: string, legacySrc: string, shot: string, appName: string) {
  const legacy = {
    src: legacySrc,
    box: f.legacy.box,
    name: "Legacy",
    alt: `${appName}, reference screen`,
  };
  const rebuilt = {
    src: `/api/runs/${run}/evidence/${encodeURIComponent(shot)}`,
    box: f.rebuilt.box,
    name: "Rebuilt",
    alt: "Rebuilt app",
  };
  // Whichever app shows the field further left goes on the left, so the default split shows both fields.
  const [left, right] =
    legacy.box && rebuilt.box && rebuilt.box.x < legacy.box.x ? [rebuilt, legacy] : [legacy, rebuilt];
  let x = 50;
  if (left.box && right.box) {
    const leftEnd = left.box.x + left.box.w + 0.02;
    const rightStart = right.box.x - 0.02;
    if (leftEnd < rightStart) x = Math.round(((leftEnd + rightStart) / 2) * 100);
  }
  // A band of each screen at the same scale, each shifted so both fields sit on one line, cut just below the
  // field (old desktop frames end in a black border under the status bar).
  const BAND = 0.4; // band height as a share of the screen height
  const R = 1 / BAND;
  const layer = (side: typeof left) => {
    const b = side.box;
    const cy = b ? b.y + b.h / 2 : 0.5;
    const top = 0.6 - cy * R; // in band heights: the field centre lands at 60% of the band
    const cut = b ? Math.max(0, 1 - (b.y + b.h + 0.002)) : 0;
    const img = `<img src="${side.src}" alt="${esc(side.alt)}" style="top:${pct(top)};clip-path:inset(0 0 ${pct(cut)} 0)">`;
    return b ? img + outline(b, f.verdict, { x: 0, y: -top / R, w: 1, h: BAND }) : img;
  };
  return `<div class="compare" data-view="screen" style="--x:${x}%">
  <div class="base">${layer(right)}</div>
  <div class="over">${layer(left)}</div>
  <input type="range" min="0" max="100" value="${x}" aria-label="Move the split between ${left.name.toLowerCase()} on the left and ${right.name.toLowerCase()} on the right">
  <span class="bar"></span><span class="knob">${icon("diff")}</span>
  <span class="who l">${left.name}</span><span class="who r">${right.name}</span>
</div>`;
}

/** The diff screen: the whole extent of the proof first, then the differences inside it, then every field. */
export function diffPage(d: DiffInput): string {
  const run = encodeURIComponent(d.run);
  const scenarioName = (id: string) => d.proof.scenarios.find((s) => s.id === id)?.name ?? id;
  if (!d.saved) {
    return shell({
      title: "Diff",
      run: d.run,
      active: "diff",
      css: CSS,
      body: `<div class="top"><span class="crumbs">Diff / <span class="run">${esc(d.run)}</span></span></div>
<p class="empty">No replay for this run yet. Run <span class="mono">bun run report runs/${esc(d.run)}</span>, then reload.</p>`,
    });
  }
  const { candidate, at, evidence } = d.saved;
  // result.json comes from a run folder: numbers and verdicts are forced to what the page expects before printing.
  const VERDICTS = new Set(["equal", "different", "masked", "accepted"]);
  const result = {
    ...d.saved.result,
    checkpoints: d.saved.result.checkpoints.map((c) => ({
      ...c,
      step: Number(c.step) || 0,
      diff: {
        ...c.diff,
        fields: c.diff.fields.map((f) => ({
          ...f,
          verdict: (VERDICTS.has(f.verdict) ? f.verdict : "different") as FieldDiff["verdict"],
        })),
        counts: Object.fromEntries(
          Object.entries(c.diff.counts).map(([k, v]) => [k, Number(v) || 0]),
        ) as typeof c.diff.counts,
      },
    })),
  };
  const all = result.checkpoints.flatMap((c) => c.diff.fields.map((f) => f.verdict));
  const equal = all.filter((v) => v === "equal").length;
  const different = all.filter((v) => v === "different").length;
  const masked = all.filter((v) => v === "masked").length;
  const accepted = all.filter((v) => v === "accepted").length;
  const missing = result.checkpoints.reduce((n, c) => n + c.diff.counts.missing, 0);
  const compared = all.length;
  const cov = d.coverage;
  const recorded = cov ? cov.rows.length : 0;
  const ex = d.explored;
  const exploredLine =
    ex && ex.scenarios > 0
      ? ` · exploration wrote <b>${ex.scenarios}</b> ${ex.scenarios === 1 ? "scenario" : "scenarios"}, <b>${ex.fields.length}</b> fields no person recorded${
          ex.fields.length
            ? `: ${esc(ex.fields.slice(0, 8).join(", "))}${ex.fields.length > 8 ? "…" : ""}`
            : ""
        }`
      : "";

  const meters = `<div class="meters">
<section class="card meter" aria-label="Fields compared">
  <header>Fields equal ${icon("check")}</header>
  <div class="big">${equal} / ${compared}<small>equal</small></div>
  ${ticks(
    [
      { n: equal, cls: "on" },
      { n: accepted, cls: "part" },
      { n: masked, cls: "warn" },
      { n: different + missing, cls: "bad" },
    ],
    compared + missing,
  )}
  <p><b>${different}</b> different · <b>${accepted}</b> accepted · <b>${masked}</b> noise · <b>${missing}</b> missing · ${result.checkpoints.length} checkpoints, replayed twice</p>
</section>
<section class="card meter" aria-label="Coverage of the recording">
  <header>Recorded fields checked ${icon("eye")}</header>
  ${
    cov
      ? `<div class="big">${cov.counts.tested} / ${recorded}<small>checked</small></div>
  ${ticks(
    [
      { n: cov.counts.tested, cls: "on" },
      { n: cov.counts.ruled, cls: "part" },
      { n: cov.counts.seen, cls: "gap" },
    ],
    recorded,
  )}
  <p><b>${cov.counts.ruled}</b> explained by a rule only · <b>${cov.counts.seen}</b> seen and never tested${exploredLine}</p>`
      : ex && ex.screens > 0
        ? `<div class="big">${ex.screens}<small>screens explored</small></div>
  <p>No recording for this run: the reference was replayed${exploredLine}</p>`
        : `<div class="big">n/a</div><p>No recording for this run: the reference was replayed.</p>`
  }
</section>
<section class="card meter" aria-label="What left this machine">
  <header>Sent from this machine ${icon("send")}</header>
  <div class="big">$${d.calls.costUsd.toFixed(2)}<small>${d.calls.calls} calls</small></div>
  ${ticks([{ n: d.calls.costUsd, cls: "on" }], d.budgetUsd)}
  <p><b>${((d.calls.costUsd / d.budgetUsd) * 100).toFixed(0)} %</b> of the $${d.budgetUsd.toFixed(0)} cap · ${(d.calls.sentBytes / 1e6).toFixed(2)} MB for capture and rebuild · replay and diff sent nothing</p>
</section>
</div>`;

  const checkpoints = result.checkpoints
    .map((c) => {
      const n = c.diff.counts;
      const total = n.equal + n.different + n.masked + n.missing + (n.accepted ?? 0);
      const by = isExplored(c.scenario) ? ` <small class="by">${icon("compass")} explored</small>` : "";
      return `<div class="row"><div class="h"><b>${esc(scenarioName(c.scenario))}, step ${Number(c.step)}</b>${by}<span>${n.equal}/${total}</span></div>
${ticks(
  [
    { n: n.equal, cls: "on" },
    { n: n.accepted ?? 0, cls: "part" },
    { n: n.masked, cls: "warn" },
    { n: n.different + n.missing, cls: "bad" },
  ],
  total,
)}</div>`;
    })
    .join("");

  const acceptForm = (c: (typeof result.checkpoints)[number], f: FieldDiff) =>
    `<div class="act"><details><summary>${icon("check")}Accept this difference</summary>
<form class="decide" data-scenario="${esc(c.scenario)}" data-step="${Number(c.step)}" data-field="${esc(f.legacy.label)}"${
      f.legacy.group ? ` data-group="${esc(f.legacy.group)}"` : ""
    }>
  <fieldset><legend>The rebuild may show ${esc(f.rebuilt.value)} here because</legend>
    <label><input type="radio" name="kind" value="legacy-bug" checked> the legacy app was wrong and the rebuild is right</label>
    <label><input type="radio" name="kind" value="change"> it is a change made on purpose</label>
  </fieldset>
  <input type="text" name="by" placeholder="Your name" maxlength="80" required autocomplete="name">
  <textarea name="why" placeholder="Why, in a sentence the next reader will understand" maxlength="1000" required></textarea>
  <p class="err" role="status"></p>
  <div><button class="btn white" type="submit">Accept with this reason</button></div>
</form></details></div>`;

  const moved = result.checkpoints.flatMap((c) => [
    ...c.diff.fields
      .filter((f) => f.verdict === "different")
      .map(
        (f) =>
          `<li><span>${esc(f.legacy.label.replace(/:$/, ""))}</span><span class="vals">${esc(f.legacy.value)} → <span class="after">${esc(
            f.rebuilt.value,
          )}</span></span><span class="where">${esc(scenarioName(c.scenario))}, step ${c.step}</span>${acceptForm(c, f)}</li>`,
      ),
    ...c.diff.missingInRebuilt.map(
      (f) =>
        `<li><span>${esc(f.label.replace(/:$/, ""))}</span><span class="vals">${esc(f.value)} → <span class="after">missing</span></span><span class="where">${esc(
          scenarioName(c.scenario),
        )}, step ${c.step}</span></li>`,
    ),
  ]);

  const fieldRows = cov
    ? cov.rows
        .map(
          (r) =>
            `<li><span>${esc(r.label)}</span><span class="f">frames ${r.frames.join(", ") || "none"}</span><span class="tag ${STATE[r.state][0]}">${STATE[r.state][1]}</span></li>`,
        )
        .join("")
    : "";

  const kinds = { "legacy-bug": "legacy app was wrong", change: "change on purpose" };
  const acceptedItems = result.checkpoints.flatMap((c) =>
    c.diff.fields
      .filter((f) => f.verdict === "accepted" && f.decision)
      .map((f) => {
        const dec = f.decision as NonNullable<FieldDiff["decision"]>;
        return `<li><span>${esc(f.legacy.label.replace(/:$/, ""))} <span class="tag blue">${kinds[dec.kind]}</span></span>
<span class="vals">${esc(f.legacy.value)} → <span class="after">${esc(f.rebuilt.value)}</span></span>
<span class="why">${esc(dec.why)}</span>
<button class="linkbtn" type="button" data-revoke data-screen="${esc(c.screen)}" data-field="${esc(dec.field)}"${
          dec.group ? ` data-group="${esc(dec.group)}"` : ""
        }>Revoke</button>
<span class="by">${esc(dec.by)}, ${esc(new Date(dec.at).toLocaleString("en-GB"))} · ${esc(scenarioName(c.scenario))}, step ${c.step}</span></li>`;
      }),
  );
  const acceptedPanel = acceptedItems.length
    ? `<section class="card panel"><header>${icon("check")}<h2>Accepted differences</h2><span class="meta">${acceptedItems.length} · stored in the proof</span></header>
<div class="body"><ul class="accepted-list">${acceptedItems.join("")}</ul></div></section>`
    : "";

  const job = d.repair?.status;
  const canRepair = d.repair?.available && (different > 0 || missing > 0) && job?.state !== "running";
  const repairPanel =
    d.repair?.available && (job || different + missing > 0)
      ? `<section class="card panel" id="repair"><header>${icon("send")}<h2>Repair with Muse Code</h2><span class="meta">one iteration, about $0.50 · capped at $${d.budgetUsd.toFixed(0)}</span></header>
<div class="body repair">
<p class="none">Muse Code gets every difference still open, with the inputs that produced it; accepted differences are left alone. Parity then replays the proof and this page shows the result.</p>
${
  job
    ? `<div class="state"><span class="dot ${job.state === "failed" ? "bad" : job.state === "done" ? "ok" : "warn"}"></span>${
        job.state === "running"
          ? `Running since ${esc(new Date(job.startedAt).toLocaleTimeString("en-GB"))}`
          : `${job.state === "done" ? "Finished" : "Failed"} at ${esc(new Date(job.endedAt ?? job.startedAt).toLocaleTimeString("en-GB"))}`
      }</div><pre aria-live="polite">${esc(job.log.slice(-40).join("\n"))}</pre>`
    : ""
}
${canRepair ? `<div><button class="btn blue" type="button" id="send-repair">${icon("send")}Send to Muse Code</button></div>` : ""}
</div></section>`
      : "";

  const history = d.history ?? [];
  const historyPanel = history.length
    ? `<section class="card panel"><header>${icon("diff")}<h2>Repair history</h2><span class="meta">${history.length} proofs · $${history
        .reduce((n, h) => n + h.costUsd, 0)
        .toFixed(2)} spent</span></header>
<div class="body"><ol class="history">${history
        .slice(-12)
        .map((h) => {
          const total = h.fieldsCompared ?? 0;
          const eq = h.fieldsEqual ?? 0;
          const state = h.error ? "error" : h.equal ? "parity" : `${h.different} different`;
          return `<li><span class="h"><b>${h.n === 0 ? "Proof before" : h.kind === "build" ? "Build" : "Repair"}</b> · ${esc(h.source)} · ${esc(
            new Date(h.at).toLocaleString("en-GB"),
          )} · $${h.costUsd.toFixed(2)}</span><span class="n">${total ? `${eq} / ${total}` : ""} <span class="tag ${
            h.error ? "bad" : h.equal ? "ok" : "warn"
          }">${state}</span></span>${
            total
              ? ticks(
                  [
                    { n: eq, cls: "on" },
                    { n: total - eq, cls: h.equal ? "part" : "bad" },
                  ],
                  total,
                )
              : ""
          }</li>`;
        })
        .join("")}</ol></div></section>`
    : "";

  const explored = d.exploration
    ? `<section class="card panel"><header>${icon("compass")}<h2>Screens found by exploration</h2><span class="meta">${Number(d.exploration.steps)} steps · $${Number(d.exploration.costUsd).toFixed(3)}</span></header>
<div class="body"><ol class="found">${d.exploration.found
        .map(
          (f) =>
            `<li><span class="n">#${Number(f.step)}</span><span>${esc(f.title)}</span><span class="l">${esc(f.labels.slice(0, 6).join(", "))}</span></li>`,
        )
        .join("")}</ol></div></section>`
    : "";

  // The screen to show: the first difference, else the first accepted one, else the first checkpoint.
  const first = (v: FieldDiff["verdict"]) =>
    result.checkpoints.flatMap((c) => c.diff.fields.filter((f) => f.verdict === v).map((f) => ({ c, f })))[0];
  const focus =
    first("different") ??
    first("accepted") ??
    result.checkpoints.flatMap((c) => c.diff.fields.slice(0, 1).map((f) => ({ c, f })))[0];
  const safeName = (name: string | undefined) =>
    name && /^[\w.-]{1,96}\.png$/.test(name) ? name : undefined;
  const shot = focus ? safeName(evidence[`${focus.c.scenario}:${focus.c.step}`]) : undefined;
  // The reference screen: a key frame of the recording, or the reference app's own screenshot when it was replayed.
  const frameNo = focus ? Number(/^frame-(\d+)$/.exec(focus.c.screen)?.[1]) : Number.NaN;
  const referenceShot = focus
    ? safeName(d.saved.reference?.[`${focus.c.scenario}:${focus.c.step}`])
    : undefined;
  const legacySrc = Number.isInteger(frameNo)
    ? `/api/runs/${run}/frames/${frameNo}`
    : referenceShot
      ? `/api/runs/${run}/evidence/${encodeURIComponent(referenceShot)}`
      : undefined;
  let both = "";
  if (focus && legacySrc && shot) {
    const { c, f } = focus;
    const differs = f.verdict === "different";
    // One scale for both strips, from the smaller field box: the text inside a tall control is no taller.
    const scale = Math.min(1, Math.min(f.legacy.box?.h ?? 1, f.rebuilt.box?.h ?? 1) / 0.3);
    const strips =
      f.legacy.box && f.rebuilt.box
        ? `<div class="strips" data-view="field" hidden>
  <figure><figcaption>Legacy</figcaption>${strip(legacySrc, f.legacy.box, f.verdict, `Legacy, ${f.legacy.label}`, scale)}</figure>
  <figure><figcaption>Rebuilt</figcaption>${strip(`/api/runs/${run}/evidence/${encodeURIComponent(shot)}`, f.rebuilt.box, f.verdict, `Rebuilt, ${f.rebuilt.label}`, scale)}</figure>
</div>`
        : "";
    both = `<section class="card panel"><header>${icon("diff")}<h2>Same invoice, both apps</h2><span class="meta">${esc(scenarioName(c.scenario))} · step ${c.step} · ${esc(
      f.legacy.label.replace(/:$/, ""),
    )}</span>${
      strips
        ? `<div class="seg" role="group" aria-label="View"><button type="button" aria-pressed="true" data-view="screen">Whole screen</button><button type="button" aria-pressed="false" data-view="field">Field</button></div>`
        : ""
    }</header>
<div class="body">
${compare(f, run, legacySrc, shot, d.proof.reference.app)}
${strips}
<div class="caption">${
      differs
        ? `<span class="vals">${esc(f.legacy.label.replace(/:$/, ""))}: ${esc(f.legacy.value)} before, <span class="after">${esc(f.rebuilt.value)}</span> after</span><span class="tag bad">different</span>`
        : `<span class="note">${esc(scenarioName(c.scenario))}, step ${c.step}: every compared field is equal.</span><span class="tag ok">equal</span>`
    }</div>
</div></section>`;
  }

  const tables = result.checkpoints
    .map(
      (
        c,
      ) => `<section class="card panel"><header>${icon("rules")}<h2>${esc(scenarioName(c.scenario))}, step ${c.step}</h2><span class="meta">${c.diff.counts.equal} equal · ${c.diff.counts.different} different · ${c.diff.counts.masked} noise</span></header>
<div class="tablewrap"><table><thead><tr><th scope="col">REFERENCE FIELD</th><th scope="col">VALUE</th><th scope="col">REBUILT FIELD</th><th scope="col">VALUE</th><th scope="col">RESULT</th></tr></thead><tbody>
${c.diff.fields
  .map(
    (f) =>
      `<tr class="${f.verdict}"><td>${esc(f.legacy.label)}</td><td class="v">${esc(f.legacy.value)}</td><td>${esc(f.rebuilt.label)}</td><td class="v">${esc(f.rebuilt.value)}</td><td><span class="tag ${
        { equal: "ok", different: "bad", masked: "warn", accepted: "blue" }[f.verdict]
      }">${f.verdict === "masked" ? "noise" : f.verdict}</span></td></tr>`,
  )
  .join("")}
${c.diff.missingInRebuilt.map((f) => `<tr class="different"><td>${esc(f.label)}</td><td class="v">${esc(f.value)}</td><td colspan="2">no counterpart</td><td><span class="tag bad">missing</span></td></tr>`).join("")}
</tbody></table></div></section>`,
    )
    .join("");

  const ok = result.equal;
  const count = different + missing;
  return shell({
    title: "Diff",
    run: d.run,
    active: "diff",
    counts: { differences: count },
    css: CSS,
    body: `<div class="top"><span class="crumbs">Diff / <span class="run">${esc(d.run)}</span></span>
<div class="right"><span class="mono" style="color:var(--t3)">${esc(candidate)}</span><a class="btn" href="/review/${run}">${icon("rules")}Rules</a></div></div>
<div class="page">
<div><h1>${esc(d.proof.reference.app)} against the rebuild <span class="verdict ${ok ? "ok" : "bad"}">${
      ok
        ? accepted
          ? `Parity · ${accepted} accepted`
          : "Parity"
        : `No parity · ${count} ${count === 1 ? "difference" : "differences"}`
    }</span></h1>
<p class="lede">Replayed ${new Date(at).toLocaleString("en-GB")}. Matching and comparison are plain code; no model judged equality.</p></div>
${meters}
<div class="split">
  <div class="col">
  <section class="card panel"><header>${icon("diff")}<h2>Fields by checkpoint</h2><span class="meta">${compared} compared</span></header>
    <div class="body">${checkpoints}<div class="legend"><span><i style="background:var(--blue)"></i>equal ${equal}</span><span><i style="background:var(--amber)"></i>noise ${masked}</span><span><i style="background:var(--red)"></i>different ${count}</span></div></div></section>
  <section class="card panel"><header>${icon("alert")}<h2>What moved</h2><span class="meta">${count} ${count === 1 ? "field" : "fields"}</span></header>
    <div class="body">${moved.length ? `<ul class="moved">${moved.join("")}</ul>` : `<p class="none">Nothing${accepted ? " open" : ""}. Every compared field has the same value in both apps${accepted ? ", or a person accepted the difference" : ""}.</p>`}</div></section>
  ${repairPanel}
  ${acceptedPanel}
  ${historyPanel}
  ${cov ? "" : explored}
  </div>
  ${
    cov
      ? `<section class="card panel"><header>${icon("eye")}<h2>Fields the recording showed</h2><span class="meta">${recorded} fields</span></header><div class="body"><ul class="fields">${fieldRows}</ul>
  <div class="legend"><span><i style="background:var(--blue)"></i>tested ${cov.counts.tested}</span><span><i style="background:rgba(76,111,255,.45)"></i>rule only ${cov.counts.ruled}</span><span><i class="gap"></i>never tested ${cov.counts.seen}</span></div></div></section>`
      : ""
  }
</div>
${cov ? explored : ""}
${both}
${tables}
</div>`,
    script: `for (const c of document.querySelectorAll(".compare")) {
  const r = c.querySelector("input");
  r.addEventListener("input", () => c.style.setProperty("--x", r.value + "%"));
}
const show = (b) => {
  for (const o of document.querySelectorAll(".seg button")) o.setAttribute("aria-pressed", String(o === b));
  for (const v of document.querySelectorAll("[data-view]:not(button)")) v.hidden = v.dataset.view !== b.dataset.view;
};
for (const b of document.querySelectorAll(".seg button")) b.addEventListener("click", () => show(b));
// On a phone the whole screen is too small to read; the field strips lead there.
const field = document.querySelector('.seg button[data-view="field"]');
if (field && matchMedia("(max-width: 640px)").matches) show(field);
const post = async (path, body) => {
  const r = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || r.statusText);
  return j;
};
const api = "/api/runs/${run}";
const remembered = (() => { try { return localStorage.getItem("parity.by") || ""; } catch { return ""; } })();
for (const form of document.querySelectorAll("form.decide")) {
  form.by.value = remembered;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = form.querySelector(".err");
    err.textContent = "";
    const body = { scenario: form.dataset.scenario, step: Number(form.dataset.step), field: form.dataset.field,
      kind: form.kind.value, by: form.by.value.trim(), why: form.why.value.trim() };
    if (form.dataset.group) body.group = form.dataset.group;
    try { localStorage.setItem("parity.by", body.by); } catch {}
    try { await post(api + "/decisions", body); location.reload(); } catch (x) { err.textContent = x.message; }
  });
}
for (const b of document.querySelectorAll("[data-revoke]")) {
  b.addEventListener("click", async () => {
    const body = { screen: b.dataset.screen, field: b.dataset.field };
    if (b.dataset.group) body.group = b.dataset.group;
    b.disabled = true;
    try { await post(api + "/decisions/revoke", body); location.reload(); } catch (x) { b.disabled = false; b.textContent = x.message; }
  });
}
// Two steps, no dialog: the first click names the cost, the second starts the run.
const send = document.getElementById("send-repair");
if (send) {
  let armed = false;
  send.addEventListener("click", async () => {
    if (!armed) { armed = true; send.lastChild.textContent = "Confirm: start one Muse Code repair, about $0.50"; return; }
    send.disabled = true;
    try { await post(api + "/repair", {}); location.hash = "repair"; location.reload(); }
    catch (x) { send.disabled = false; armed = false; send.lastChild.textContent = x.message; }
  });
}
${
  job?.state === "running"
    ? `setTimeout(function poll() {
  fetch(api + "/repair").then((r) => r.json()).then((j) => {
    const pre = document.querySelector("#repair pre");
    if (pre) { pre.textContent = j.log.slice(-40).join("\\n"); pre.scrollTop = pre.scrollHeight; }
    if (j.state === "running") setTimeout(poll, 1500); else location.reload();
  }).catch(() => setTimeout(poll, 3000));
}, 1500);`
    : ""
}`,
  });
}
