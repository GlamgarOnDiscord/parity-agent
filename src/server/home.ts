import { esc, icon, shell } from "./ui";

export interface RunEntry {
  run: string;
  /** Which screens have something to show for this run. */
  rules: boolean;
  diff: boolean;
  migration: boolean;
}

const CSS = `
.runs { max-width: 880px; display: grid; gap: 16px; padding: 24px 28px 48px; }
.runs table { width: 100%; border-collapse: collapse; font-size: 13px; }
.runs th { text-align: left; color: var(--t3); font-weight: 500; padding: 10px 16px; border-bottom: 1px solid var(--line); }
.runs td { padding: 12px 16px; border-bottom: 1px solid var(--line); }
.runs tr:last-child td { border-bottom: 0; }
.runs td a { color: var(--blue-hi); text-decoration: none; margin-right: 16px; }
.runs td a:hover { text-decoration: underline; }
.runs .none { color: var(--t3); }
`;

/** Where the launch link lands: every run in this folder, with the screens it has. */
export function homePage(runs: RunEntry[]): string {
  const rows = runs
    .map((r) => {
      const u = encodeURIComponent(r.run);
      const links = [
        r.rules ? `<a href="/review/${u}">Rules</a>` : "",
        r.diff ? `<a href="/diff/${u}">Diff</a>` : "",
        r.migration ? `<a href="/migrate/${u}">Migration</a>` : "",
      ].join("");
      return `<tr><td class="mono">${esc(r.run)}</td><td>${links || '<span class="none">nothing to show yet</span>'}</td></tr>`;
    })
    .join("");
  return shell({
    title: "Runs",
    run: "",
    active: "home",
    css: CSS,
    body: `<div class="top"><span class="crumbs">Runs</span></div>
<div class="runs">
${
  runs.length
    ? `<section class="card"><table><thead><tr><th>Run</th><th>Screens</th></tr></thead><tbody>${rows}</tbody></table></section>`
    : `<p class="empty"><a href="/new">Rebuild an app</a> in three steps, or start from the example. No run yet. Try <span class="mono">bun run report --proof fixtures/proofs/vs3-invoice.json --fixture</span>, then reload. ${icon("eye")}</p>`
}
</div>`,
  });
}
