import { icon, shell } from "./ui";

const CSS = `
.work { display: grid; grid-template-columns: 280px minmax(0, 1fr) 360px; min-height: calc(100vh - 67px); }
.list { border-right: 1px solid var(--line); padding: 14px 10px; display: flex; flex-direction: column; gap: 2px; }
.list p { color: var(--t3); font-size: 12px; margin: 2px 8px 10px; }
.item { display: grid; grid-template-columns: 8px 1fr; gap: 4px 10px; align-items: center; width: 100%; text-align: left;
  border: 1px solid transparent; background: none; color: var(--t2); font: inherit; padding: 9px 10px; border-radius: 10px;
  cursor: pointer; transition: background .16s ease-out; }
.item:hover { background: var(--card); color: var(--t1); }
.item[aria-current="true"] { background: var(--card-2); border-color: var(--line-2); color: var(--t1); }
.item .t { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item .m { grid-column: 2; display: flex; gap: 6px; align-items: center; font: 11px var(--mono); color: var(--t3); }
.detail { padding: 34px 40px 48px; min-width: 0; }
.detail h1 { font-size: 34px; line-height: 1.15; font-weight: 600; letter-spacing: -0.02em; margin: 0; display: flex;
  align-items: center; gap: 12px; flex-wrap: wrap; text-wrap: balance; }
.sub { color: var(--t2); margin: 10px 0 28px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.statement { font-size: 17px; line-height: 1.55; max-width: 62ch; margin: 0 0 30px; color: var(--t1); }
.label { font: 500 11px var(--mono); color: var(--t3); letter-spacing: .04em; margin: 0 0 8px; }
.formula { background: var(--bg); border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px; display: flex;
  flex-wrap: wrap; gap: 6px; align-items: center; font: 13px var(--mono); color: var(--t2); margin-bottom: 14px; }
.formula .eq { color: var(--t3); margin: 0 4px; }
.chip { display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 6px; background: var(--card-2);
  border: 1px solid var(--line-2); color: var(--t1); font: 12px Geist, system-ui, sans-serif; }
.chip.target { border-color: rgba(76, 111, 255, .5); color: var(--blue-hi); }
.check { display: grid; grid-template-columns: 1fr auto; gap: 8px 16px; align-items: center; padding: 14px 16px;
  border: 1px solid var(--line); border-radius: 10px; margin-bottom: 30px; }
.check b { font-weight: 500; } .nowrap { white-space: nowrap; font-size: 12px; } .check .ticks { grid-column: 1 / -1; }
.check .n { font-size: 12px; color: var(--t2); margin-top: 2px; }
.examples { grid-column: 1 / -1; display: grid; gap: 4px; font: 12px var(--mono); color: #fca5a5; }
.origin { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 1px solid var(--line); }
.origin div { padding: 14px 16px 0 0; } .origin dt { color: var(--t3); font-size: 12px; } .origin dd { margin: 3px 0 0; }
.activity { border-left: 1px solid var(--line); background: var(--side); display: flex; flex-direction: column; min-width: 0; }
.activity header { padding: 16px 18px; border-bottom: 1px solid var(--line); font-weight: 600; }
.banner { margin: 16px 18px 4px; padding: 10px 12px; border-radius: 10px; display: flex; gap: 10px; align-items: flex-start; }
.banner.warn { background: rgba(245, 158, 11, .1); color: #fcd34d; }
.banner.ok { background: rgba(34, 197, 94, .1); color: #86efac; }
.banner.bad { background: rgba(239, 68, 68, .1); color: #fca5a5; }
.steps { list-style: none; margin: 0; padding: 14px 18px; display: grid; gap: 4px; flex: 1; overflow: auto; align-content: start; }
.step { display: grid; grid-template-columns: 20px 1fr; gap: 2px 12px; padding-bottom: 14px; position: relative; }
.step::before { content: ""; position: absolute; left: 9.5px; top: 24px; bottom: 2px; width: 1px; background: var(--line-2); }
.step:last-child::before { display: none; }
.step .ic { width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center; background: var(--card-2); color: var(--t2); }
.step .ic .i { width: 12px; height: 12px; }
.step .ic.ok { color: var(--green); } .step .ic.bad { color: var(--red); } .step .ic.warn { color: var(--amber); }
.step h3 { font-size: 13px; font-weight: 600; margin: 0; } .step time { color: var(--t3); font-size: 12px; }
.facts { grid-column: 2; margin-top: 8px; border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px;
  display: grid; grid-template-columns: 74px 1fr; gap: 6px 10px; background: var(--card); }
.facts dt { color: var(--t3); } .facts dd { margin: 0; overflow-wrap: anywhere; }
.thumbs { grid-column: 2; display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
.thumbs figure { margin: 0; }
.thumb { position: relative; width: 150px; aspect-ratio: 10 / 3; background: #fff; border-radius: 6px; overflow: hidden; outline: 1px solid var(--line-2); outline-offset: -1px; }
.thumb img { position: absolute; max-width: none; height: auto; }
.thumb .mark { position: absolute; border: 1.5px solid var(--blue); border-radius: 3px; }
.thumbs figcaption { font: 11px var(--mono); color: var(--t3); margin-top: 3px; }
.decide { border-top: 1px solid var(--line); padding: 14px 18px; display: flex; gap: 10px; align-items: center; }
.slide { position: relative; flex: 1; height: 42px; border-radius: 999px; background: var(--card-2); border: 1px solid var(--line-2);
  display: grid; place-items: center; color: var(--t2); user-select: none; overflow: hidden; touch-action: none; }
.slide .fill { position: absolute; inset: 0 auto 0 0; width: 0; background: rgba(34, 197, 94, .18); }
.slide .knob { position: absolute; left: 4px; top: 4px; width: 32px; height: 32px; border-radius: 50%; background: var(--t1);
  color: #0e0e10; border: 0; display: grid; place-items: center; cursor: grab; transition: transform .2s ease-out; }
.slide.dragging .knob { transition: none; cursor: grabbing; }
.decided { color: var(--t2); display: flex; gap: 8px; align-items: center; }
@media (max-width: 1200px) { .work { grid-template-columns: 240px 1fr; } .activity { grid-column: 1 / -1; border-left: 0; border-top: 1px solid var(--line); } }
@media (max-width: 760px) { .work { grid-template-columns: 1fr; align-content: start; } .list { border-right: 0; } .detail { padding: 24px 18px; } .origin { grid-template-columns: repeat(2, 1fr); } }
`;

/** Runs in the browser. Talks to /api/* with the HttpOnly session cookie; holds no secret. */
const SCRIPT = (runId: string) => `
const RUN = ${JSON.stringify(runId)};
const api = (p, init) => fetch("/api/runs/" + encodeURIComponent(RUN) + p, init);
const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v; else if (k === "html") e.innerHTML = v; else if (v !== undefined && v !== null) e.setAttribute(k, v);
  }
  for (const c of kids) if (c !== null && c !== undefined) e.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return e;
};
const ICON = ${JSON.stringify({
  check: icon("check"),
  x: icon("x"),
  alert: icon("alert"),
  frame: icon("frame"),
  quote: icon("quote"),
  code: icon("code"),
  arrow: icon("arrow"),
  spark: icon("spark"),
})};
const svg = (name) => el("span", { html: ICON[name] }).firstChild;
const time = (t) => { const s = Math.round(t); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
const STATUS = { pending: ["warn", "Waiting"], accepted: ["ok", "Accepted"], rejected: ["bad", "Rejected"] };
let rules = [];
let current = null;
const frames = new Map();
async function frame(n) {
  if (!frames.has(n)) frames.set(n, api("/frames/" + n).then((r) => (r.ok ? r.blob() : null)).then((b) => (b ? URL.createObjectURL(b) : null)));
  return frames.get(n);
}
function checkTag(r) {
  if (!r.check) return el("span", { class: "tag" }, "not a formula");
  if (r.check.contradicted) return el("span", { class: "tag bad" }, r.check.contradicted + " contradicted");
  return el("span", { class: "tag ok" }, r.check.verified + " verified");
}
function formula(r) {
  const box = el("div", { class: "formula", "aria-label": "Formula" });
  box.append(el("span", { class: "chip target" }, r.target.replace(/:$/, "")), el("span", { class: "eq" }, "="));
  for (const part of r.expression.split(/(\\{[^}]+\\})/)) {
    if (!part.trim()) continue;
    box.append(part.startsWith("{") ? el("span", { class: "chip" }, part.slice(1, -1).replace(/:$/, "")) : el("span", {}, part.trim()));
  }
  return box;
}
function check(r) {
  const c = r.check;
  const total = c.verified + c.contradicted + c.untestable;
  const cells = el("div", { class: "ticks", "aria-hidden": "true" });
  for (let i = 0; i < 32; i++) {
    const at = (i + 0.5) / 32 * Math.max(total, 1);
    cells.append(el("i", { class: total === 0 ? "" : at <= c.verified ? "on" : at <= c.verified + c.contradicted ? "bad" : "" }));
  }
  const box = el("div", { class: "check" },
    el("div", {}, el("b", {}, "Checked by code against the recorded values"), el("div", { class: "n" },
      c.verified + " frames reproduce it · " + c.contradicted + " contradict it · " + c.untestable + " untestable")),
    checkTag(r), cells);
  if (c.examples?.length) box.append(el("div", { class: "examples" }, ...c.examples.map((x) => el("div", {}, "frame " + x.frame + ": screen shows " + x.expected + ", formula gives " + x.computed))));
  return box;
}
function detail(r) {
  const d = document.getElementById("detail");
  d.replaceChildren();
  d.append(el("h1", {}, r.title, el("span", { class: "tag" }, r.id)));
  const sub = el("p", { class: "sub" }, el("span", { class: "tag" }, r.kind));
  if (r.target) sub.append(el("span", {}, "Computes ", el("b", {}, r.target.replace(/:$/, ""))));
  if (r.fields?.length) sub.append(el("span", {}, "· uses " + r.fields.length + " fields"));
  d.append(sub, el("p", { class: "statement" }, r.statement));
  if (r.expression) d.append(el("p", { class: "label" }, "FORMULA"), formula(r));
  if (r.check) d.append(check(r));
  const origin = el("dl", { class: "origin" });
  const row = (k, v) => origin.append(el("div", {}, el("dt", {}, k), el("dd", {}, v)));
  row("Status", STATUS[r.status][1]);
  row("Found by", el("span", { class: "mono nowrap" }, r.model));
  row("Confidence", Math.round(r.confidence * 100) + " %");
  const n = (k, w) => k + " " + w + (k === 1 ? "" : "s");
  row("Evidence", n(r.evidence.frames.length, "frame") + ", " + n(r.evidence.quotes.length, "quote"));
  d.append(origin);
}
function activity(r) {
  const [cls, word] = STATUS[r.status];
  const banner = document.getElementById("banner");
  banner.className = "banner " + cls;
  banner.replaceChildren(svg(r.status === "pending" ? "alert" : r.status === "accepted" ? "check" : "x"),
    el("span", {}, r.status === "pending" ? "Waiting for the expert. Only accepted rules go into the rebuild." :
      word + (r.decidedAt ? " on " + new Date(r.decidedAt).toLocaleString() : "") + (r.note ? ": " + r.note : "") + "."));
  const steps = document.getElementById("steps");
  steps.replaceChildren();
  const step = (ic, cls2, title, when, ...extra) => steps.append(el("li", { class: "step" },
    el("span", { class: "ic " + cls2 }, svg(ic)), el("div", {}, el("h3", {}, title), when ? el("time", {}, when) : null), ...extra));
  const thumbs = el("div", { class: "thumbs" });
  const figs = new Map();
  for (const f of r.evidence.frames) {
    const fig = el("figure", {}, el("div", { class: "thumb" }), el("figcaption", {}, "frame " + f.index + " · " + time(f.t)));
    figs.set(f.index, fig);
    thumbs.append(fig);
  }
  step("frame", "", "Read from the recording", r.evidence.frames.length ? "first seen at " + time(r.evidence.frames[0].t) : null,
    el("dl", { class: "facts" }, el("dt", {}, "Found by"), el("dd", { class: "mono" }, r.model),
      el("dt", {}, "Fields"), el("dd", {}, (r.fields || []).map((x) => x.replace(/:$/, "")).join(", ") || "none")), thumbs);
  for (const q of r.evidence.quotes) step("quote", "", "Narration matched", "at " + time(q.start),
    el("dl", { class: "facts" }, el("dt", {}, "Source"), el("dd", { class: "mono" }, "voice-transcribe"), el("dt", {}, "Quote"), el("dd", {}, "\\u201c" + q.text + "\\u201d")));
  const codeFacts = el("dl", { class: "facts" }, el("dt", {}, "Verified"), el("dd", {}, r.check?.verified + " frames"), el("dt", {}, "Contradicted"), el("dd", {}, String(r.check?.contradicted)));
  if (r.check) step("code", r.check.contradicted ? "bad" : "ok", "Checked by code", null, codeFacts);
  evidence(r, figs, codeFacts);
  if (r.escalated) step("spark", "warn", "Revised by Muse Wonder", "the first formula was contradicted");
  step(r.status === "pending" ? "alert" : r.status === "accepted" ? "check" : "x", cls,
    r.status === "pending" ? "Waiting for the expert" : word, r.decidedAt ? new Date(r.decidedAt).toLocaleString() : null);
  const foot = document.getElementById("decide");
  foot.replaceChildren();
  if (r.status !== "pending") { foot.append(el("span", { class: "decided" }, svg(r.status === "accepted" ? "check" : "x"), word)); return; }
  const reject = el("button", { class: "btn", type: "button" }, "Reject");
  reject.onclick = () => decide(r.id, "rejected");
  foot.append(reject, slider(() => decide(r.id, "accepted")));
}
// The rule's field, cropped out of each recorded frame, and the formula worked out with the numbers on screen.
async function evidence(r, figs, codeFacts) {
  const res = await api("/rules/" + encodeURIComponent(r.id) + "/evidence");
  if (!res.ok || current !== r.id) return;
  const { worked, frames: places } = await res.json();
  for (const p of places) {
    const fig = figs.get(p.index);
    const src = await frame(p.index);
    if (!fig || !src || current !== r.id) continue;
    const box = fig.querySelector(".thumb");
    const img = el("img", { src, alt: "Recorded frame " + p.index });
    if (p.box) {
      const b = p.box;
      const ch = Math.min(1, b.h / 0.4), cw = Math.min(1, (ch * 10 / 3) / 1.6);
      const x = Math.max(0, Math.min(1 - cw, b.x + b.w / 2 - cw * 0.6)), y = Math.max(0, b.y + b.h * 1.1 - ch);
      img.style.cssText = "width:" + (100 / cw) + "%;left:" + (-x / cw * 100) + "%;top:" + (-y / ch * 100) + "%";
      box.append(img, el("span", { class: "mark", style: "left:" + ((b.x - x) / cw * 100 - 1) + "%;top:" + ((b.y - y) / ch * 100 - 4) + "%;width:" + (b.w / cw * 100 + 2) + "%;height:" + (b.h / ch * 100 + 8) + "%" }));
    } else {
      img.style.cssText = "width:100%;left:0;top:0";
      box.append(img);
    }
  }
  if (worked && codeFacts) {
    const ins = worked.inputs.map((x) => x.label.replace(/:$/, "") + " " + x.value.toFixed(2)).join(", ");
    codeFacts.append(el("dt", {}, "Worked"), el("dd", {}, "Frame " + worked.frame + ": from " + ins + ", the formula gives " +
      worked.computed.toFixed(2) + "; the screen shows " + worked.shown.toFixed(2) + "."));
  }
}
function slider(onDone) {
  const knob = el("button", { class: "knob", type: "button", "aria-label": "Validate this rule: slide right, or press Enter" }, svg("arrow"));
  const fill = el("span", { class: "fill" });
  const track = el("div", { class: "slide" }, fill, el("span", {}, "Slide to validate"), knob);
  let start = null;
  const max = () => track.clientWidth - knob.clientWidth - 8;
  const set = (x) => { knob.style.transform = "translateX(" + x + "px)"; fill.style.width = (x + 36) + "px"; };
  knob.addEventListener("pointerdown", (e) => { start = e.clientX; track.classList.add("dragging"); knob.setPointerCapture(e.pointerId); });
  knob.addEventListener("pointermove", (e) => { if (start !== null) set(Math.max(0, Math.min(max(), e.clientX - start))); });
  knob.addEventListener("pointerup", (e) => {
    if (start === null) return;
    const x = e.clientX - start; start = null; track.classList.remove("dragging");
    if (x >= max() * 0.85) { set(max()); onDone(); } else set(0);
  });
  knob.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); set(max()); onDone(); } });
  return track;
}
async function decide(id, status) {
  const res = await api("/rules/" + encodeURIComponent(id), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
  if (res.ok) await load(id);
}
function list() {
  const box = document.getElementById("list");
  box.replaceChildren();
  const waiting = rules.filter((r) => r.status === "pending").length;
  box.append(el("p", {}, rules.length + " rules · " + waiting + " waiting"));
  for (const r of rules) {
    const b = el("button", { class: "item", type: "button", "aria-current": String(r.id === current) },
      el("span", { class: "dot " + STATUS[r.status][0], title: STATUS[r.status][1] }), el("span", { class: "t" }, r.title),
      el("span", { class: "m" }, el("span", {}, r.id), el("span", {}, r.check ? (r.check.contradicted ? r.check.contradicted + " contradicted" : r.check.verified + " verified") : r.kind)));
    b.onclick = () => select(r.id);
    box.append(b);
  }
}
function select(id) {
  current = id;
  const r = rules.find((x) => x.id === id);
  if (!r) return;
  list(); detail(r); activity(r);
  document.getElementById("crumb").textContent = r.title;
  history.replaceState(null, "", "#" + encodeURIComponent(id));
}
async function load(keep) {
  const res = await api("/rules");
  rules = res.ok ? await res.json() : [];
  if (!rules.length) { document.getElementById("detail").replaceChildren(el("p", { class: "empty" }, "No rules for this run yet. Run a capture first.")); list(); return; }
  const wanted = keep ?? decodeURIComponent(location.hash.slice(1));
  select(rules.some((r) => r.id === wanted) ? wanted : (rules.find((r) => r.status === "pending") ?? rules[0]).id);
}
load();
`;

/** The rule review screen. Holds no secret: its API calls ride on the HttpOnly session cookie. */
export function reviewPage(runId: string): string {
  return shell({
    title: "Rules",
    run: runId,
    active: "rules",
    css: CSS,
    body: `<div class="top"><span class="crumbs">Rules / <span class="run">${runId.replace(/[<>&"']/g, "")}</span> / <b id="crumb"></b></span>
<div class="right"><a class="btn" href="/diff/${encodeURIComponent(runId)}">${icon("diff")}Open the diff</a></div></div>
<div class="work">
  <aside class="list" id="list" aria-label="Rules"></aside>
  <section class="detail" id="detail" aria-live="polite"></section>
  <aside class="activity" aria-label="Rule activity">
    <header>Rule activity</header>
    <div class="banner" id="banner"></div>
    <ol class="steps" id="steps"></ol>
    <div class="decide" id="decide"></div>
  </aside>
</div>`,
    script: SCRIPT(runId),
  });
}
