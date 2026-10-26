/** Shared look of the local app screens: tokens, fonts served by this server, icons and the navigation shell. */

export const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const ICONS: Record<string, string> = {
  rules: '<path d="M8 6h11M8 12h11M8 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
  diff: '<path d="M12 3v18"/><rect x="3" y="6" width="6" height="12" rx="1.5"/><rect x="15" y="6" width="6" height="12" rx="1.5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/>',
  frame: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18"/>',
  quote:
    '<path d="M5 18V8.5A3.5 3.5 0 0 1 8.5 5H19v9.5a3.5 3.5 0 0 1-3.5 3.5H9z"/><path d="M9 10h6M9 13.5h4"/>',
  code: '<path d="m9 8-4 4 4 4M15 8l4 4-4 4"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  send: '<path d="M4 12 20 4l-6 16-2.5-6.5z"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
};

export const icon = (name: keyof typeof ICONS | string, cls = "i") =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] ?? ""}</svg>`;

/** The P of Parity with one pixel broken away. */
const LOGO =
  '<svg class="logo" viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M4 3h7a5 5 0 0 1 0 10H7.4v4H4zm3.4 3.2v3.6H11a1.8 1.8 0 0 0 0-3.6z"/><rect x="15.2" y="1" width="3" height="3" fill="#4C6FFF"/></svg>';

const CSS = `
@font-face { font-family: "Geist"; src: url("/assets/fonts/Geist-Variable.woff2") format("woff2"); font-weight: 100 900; font-display: swap; }
@font-face { font-family: "Geist Mono"; src: url("/assets/fonts/GeistMono-Variable.woff2") format("woff2"); font-weight: 100 900; font-display: swap; }
:root {
  --rail: #0c0c0e; --bg: #0e0e10; --app: #111113; --side: #161618; --card: #19191c; --card-2: #202024;
  --line: #26262b; --line-2: #313137; --t1: #f4f4f5; --t2: #a1a1aa; --t3: #8b8b94;
  --blue: #4c6fff; --blue-btn: #2a4bff; --blue-hi: #7690ff;
  --green: #22c55e; --red: #ef4444; --red-fill: #dc2626; --amber: #f59e0b;
  --mono: "Geist Mono", ui-monospace, "Cascadia Mono", Consolas, monospace;
  color-scheme: dark;
}
* { box-sizing: border-box; }
[hidden] { display: none !important; }
html { background: var(--bg); }
body { margin: 0; color: var(--t1); font: 13px/1.5 Geist, "Segoe UI Variable", system-ui, sans-serif;
  font-variant-numeric: tabular-nums; -webkit-font-smoothing: antialiased; }
::selection { background: rgba(76, 111, 255, .35); color: #fff; }
* { scrollbar-width: thin; scrollbar-color: var(--line-2) transparent; }
:focus-visible { outline: 2px solid var(--blue-hi); outline-offset: 2px; border-radius: 6px; }
a { color: var(--blue-hi); text-underline-offset: 3px; }
.mono { font-family: var(--mono); }
.i { width: 16px; height: 16px; flex: none; }
.shell { display: grid; grid-template-columns: 232px 1fr; min-height: 100vh; }
.nav { background: var(--side); border-right: 1px solid var(--line); padding: 18px 12px; display: flex; flex-direction: column; gap: 4px; }
.brand { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; padding: 0 8px 18px; }
.logo { width: 18px; height: 18px; color: var(--t1); }
.nav h2 { font-size: 12px; font-weight: 500; color: var(--t3); margin: 14px 8px 6px; }
.nav a { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; color: var(--t2);
  text-decoration: none; font-size: 13px; transition: background .16s ease-out, color .16s ease-out; }
.nav a:hover { background: var(--card); color: var(--t1); }
.nav a[aria-current="page"] { background: var(--card-2); color: var(--t1); }
.nav .count { margin-left: auto; font: 11px var(--mono); color: var(--t3); background: var(--card-2); border-radius: 5px; padding: 1px 6px; }
.nav .foot { margin-top: auto; padding: 12px 8px 0; border-top: 1px solid var(--line); color: var(--t3); font-size: 12px; }
.nav .foot b { color: var(--t2); font-weight: 500; }
main { min-width: 0; background: var(--app); }
.top { display: flex; align-items: center; gap: 12px; padding: 16px 28px; border-bottom: 1px solid var(--line); }
.crumbs { color: var(--t2); } .crumbs b { color: var(--t1); font-weight: 600; }
.crumbs .run { font-family: var(--mono); color: var(--blue-hi); }
.top .right { margin-left: auto; display: flex; gap: 8px; align-items: center; }
.btn { white-space: nowrap; display: inline-flex; align-items: center; gap: 8px; height: 34px; padding: 0 14px; border-radius: 8px; font: inherit;
  font-weight: 500; border: 1px solid var(--line-2); background: var(--card-2); color: var(--t1); cursor: pointer;
  text-decoration: none; transition: background .16s ease-out, border-color .16s ease-out; }
.btn:hover { background: #2a2a2f; }
.btn.white { background: var(--t1); color: #0e0e10; border-color: var(--t1); } .btn.white:hover { background: #fff; }
.btn.blue { background: var(--blue-btn); border-color: var(--blue-btn); color: #fff; }
.btn:disabled { opacity: .45; cursor: not-allowed; }
.tag { display: inline-flex; align-items: center; gap: 5px; font: 500 11px var(--mono); padding: 2px 7px; border-radius: 5px;
  background: var(--card-2); color: var(--t2); white-space: nowrap; }
.tag.ok { background: rgba(34, 197, 94, .12); color: #86efac; }
.tag.bad { background: rgba(239, 68, 68, .14); color: #fca5a5; }
.tag.warn { background: rgba(245, 158, 11, .14); color: #fcd34d; }
.tag.blue { background: rgba(76, 111, 255, .16); color: var(--blue-hi); }
.tag.hollow { background: transparent; box-shadow: inset 0 0 0 1px var(--line-2); color: var(--t2); }
.dot { width: 7px; height: 7px; border-radius: 50%; background: var(--t3); flex: none; }
.dot.ok { background: var(--green); } .dot.bad { background: var(--red); } .dot.warn { background: var(--amber); }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; }
.ticks { display: grid; grid-template-columns: repeat(32, 1fr); gap: 2px; height: 10px; }
.ticks i { border-radius: 1px; background: #2a2a30; }
.ticks i.on { background: var(--blue); } .ticks i.part { background: rgba(76, 111, 255, .45); }
.ticks i.gap { background: transparent; box-shadow: inset 0 0 0 1px var(--line-2); } .ticks i.bad { background: var(--red); } .ticks i.warn { background: var(--amber); }
.empty { color: var(--t2); padding: 28px; }
@media (max-width: 900px) { .top .right .btn { display: none; } .shell { grid-template-columns: 1fr; } .nav { flex-direction: row; flex-wrap: wrap; } .nav .foot, .nav h2 { display: none; } }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
`;

/**
 * 32 segments filled in proportion to `total`. When the parts add up to the total, the last part takes the
 * rounding remainder so the meter reads full; otherwise the empty cells show what is left (a budget, say).
 */
export function ticks(parts: { n: number; cls: string }[], total: number) {
  const cells: string[] = [];
  const whole = Math.abs(parts.reduce((n, p) => n + p.n, 0) - total) < 1e-9;
  let used = 0;
  parts.forEach((p, i) => {
    let count = Math.round((p.n / Math.max(total, 1e-9)) * 32);
    if (p.n > 0) count = Math.max(count, 1);
    if (whole && i === parts.length - 1 && p.n > 0) count = 32 - used;
    const k = Math.max(0, Math.min(32 - used, count));
    for (let j = 0; j < k; j++) cells.push(`<i class="${p.cls}"></i>`);
    used += k;
  });
  while (cells.length < 32) cells.push("<i></i>");
  return `<div class="ticks" aria-hidden="true">${cells.slice(0, 32).join("")}</div>`;
}

export interface ShellOptions {
  title: string;
  run: string;
  active: "rules" | "diff";
  css: string;
  body: string;
  script?: string;
  counts?: { rules?: number; differences?: number };
}

/** The page frame both screens share. No external resource: fonts come from this server, scripts are inline. */
export function shell(o: ShellOptions): string {
  const r = encodeURIComponent(o.run);
  const link = (href: string, name: string, label: string, key: "rules" | "diff", count?: number) =>
    `<a href="${href}"${o.active === key ? ' aria-current="page"' : ""}>${icon(name)}${label}${
      count !== undefined ? `<span class="count">${count}</span>` : ""
    }</a>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)} · ${esc(o.run)} · Parity</title>
<link rel="preload" href="/assets/fonts/Geist-Variable.woff2" as="font" type="font/woff2" crossorigin>
<style>${CSS}${o.css}</style>
</head>
<body>
<div class="shell">
<nav class="nav" aria-label="Parity">
  <div class="brand">${LOGO}Parity</div>
  <h2>Run <span class="mono">${esc(o.run)}</span></h2>
  ${link(`/review/${r}`, "rules", "Rules", "rules", o.counts?.rules)}
  ${link(`/diff/${r}`, "diff", "Diff", "diff", o.counts?.differences)}
  <div class="foot">Local on <b>127.0.0.1</b>. Replays and diffs never leave this machine.</div>
</nav>
<main>${o.body}</main>
</div>
${o.script ? `<script>${o.script}</script>` : ""}
</body>
</html>`;
}
