/** The rule review screen. Holds no secret: its API calls ride on the HttpOnly session cookie. */
export function reviewPage(runId: string): string {
  const safe = (s: string) => s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Parity · rules · ${safe(runId)}</title>
<style>
  :root { --bg: #0e0e10; --card: #19191c; --line: #26262b; --t1: #f4f4f5; --t2: #a1a1aa; --blue: #2a4bff;
    --green: #22c55e; --red: #ef4444; --amber: #f59e0b; color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--t1); font: 14px/1.5 ui-sans-serif, system-ui, sans-serif; }
  main { max-width: 980px; margin: 0 auto; padding: 32px 20px 80px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .sub { color: var(--t2); margin: 0 0 24px; }
  .rule { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 16px 18px;
    margin-bottom: 12px; display: grid; grid-template-columns: 1fr auto; gap: 12px; }
  .rule h2 { font-size: 15px; margin: 0; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .id { font: 12px ui-monospace, monospace; color: var(--t2); }
  .tag { font: 500 11px ui-monospace, monospace; padding: 2px 7px; border-radius: 5px; background: #26262b; color: var(--t2); }
  .ok { background: rgba(34, 197, 94, .15); color: #86efac; }
  .bad { background: rgba(239, 68, 68, .15); color: #fca5a5; }
  .esc { background: rgba(245, 158, 11, .15); color: #fcd34d; }
  .statement { margin: 6px 0; }
  code { font: 12.5px ui-monospace, monospace; background: #111113; border: 1px solid var(--line); border-radius: 7px;
    padding: 6px 9px; display: block; white-space: pre-wrap; color: #c4c4cc; }
  .quote { color: var(--t2); margin: 6px 0 0; font-style: italic; }
  .frames { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
  .frames img { height: 64px; border-radius: 6px; border: 1px solid var(--line); }
  .actions { display: flex; flex-direction: column; gap: 6px; align-items: stretch; min-width: 120px; }
  button { font: inherit; border-radius: 9px; padding: 7px 12px; cursor: pointer; border: 1px solid var(--line);
    background: #202024; color: var(--t1); }
  button.accept { background: var(--blue); border-color: var(--blue); color: #fff; }
  button:focus-visible { outline: 2px solid #7690ff; outline-offset: 2px; }
  .status { font-size: 12px; color: var(--t2); text-align: center; }
  .accepted { border-color: rgba(34, 197, 94, .5); }
  .rejected { opacity: .55; }
  @media (max-width: 640px) { .rule { grid-template-columns: 1fr; } .actions { flex-direction: row; } }
</style>
</head>
<body>
<main>
  <h1>Rules to review</h1>
  <p class="sub" id="summary">Loading…</p>
  <div id="rules"></div>
</main>
<script>
  const RUN = ${JSON.stringify(runId)};
  const AUTH = {};
  const el = (tag, attrs = {}, ...children) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) k === "class" ? (e.className = v) : e.setAttribute(k, v);
    for (const c of children) e.append(c instanceof Node ? c : document.createTextNode(String(c)));
    return e;
  };
  async function frame(n) {
    const res = await fetch("/api/runs/" + encodeURIComponent(RUN) + "/frames/" + n, { headers: AUTH });
    return res.ok ? URL.createObjectURL(await res.blob()) : null;
  }
  async function decide(id, status) {
    const res = await fetch("/api/runs/" + encodeURIComponent(RUN) + "/rules/" + encodeURIComponent(id), {
      method: "POST", headers: { ...AUTH, "content-type": "application/json" }, body: JSON.stringify({ status }),
    });
    if (res.ok) load();
  }
  async function load() {
    const rules = await (await fetch("/api/runs/" + encodeURIComponent(RUN) + "/rules", { headers: AUTH })).json();
    const pending = rules.filter((r) => r.status === "pending").length;
    document.getElementById("summary").textContent =
      rules.length + " rules from run " + RUN + " · " + pending + " waiting for a decision";
    const list = document.getElementById("rules");
    list.replaceChildren();
    for (const r of rules) {
      const tags = [el("span", { class: "tag" }, r.kind)];
      if (r.check) {
        tags.push(el("span", { class: "tag " + (r.check.contradicted ? "bad" : r.check.verified ? "ok" : "") },
          r.check.verified + " verified · " + r.check.contradicted + " contradicted"));
      }
      if (r.escalated) tags.push(el("span", { class: "tag esc" }, "escalated"));
      const body = el("div", {},
        el("h2", {}, el("span", { class: "id" }, r.id), r.title, ...tags),
        el("p", { class: "statement" }, r.statement));
      if (r.expression) body.append(el("code", {}, r.target + " = " + r.expression));
      for (const q of r.evidence.quotes) body.append(el("p", { class: "quote" }, "“" + q.text + "” · " + q.start.toFixed(1) + " s"));
      const frames = el("div", { class: "frames" });
      for (const f of r.evidence.frames) {
        frame(f.index).then((src) => src && frames.append(el("img", { src, alt: "Frame " + f.index + " at " + f.t.toFixed(1) + " s" })));
      }
      body.append(frames);
      const actions = el("div", { class: "actions" });
      if (r.status === "pending") {
        const yes = el("button", { type: "button", class: "accept" }, "Accept");
        yes.onclick = () => decide(r.id, "accepted");
        const no = el("button", { type: "button" }, "Reject");
        no.onclick = () => decide(r.id, "rejected");
        actions.append(yes, no);
      } else {
        actions.append(el("span", { class: "status" }, r.status));
      }
      list.append(el("article", { class: "rule " + r.status }, body, actions));
    }
  }
  load();
</script>
</body>
</html>`;
}
