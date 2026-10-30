import { z } from "zod";
import { esc, icon, shell, ticks } from "./ui";

const count = z.number().int().min(0).max(1e7);
// A run folder can come from someone else: the board is checked before the page prints it.
export const BoardSchema = z.object({
  name: z.string().max(40),
  title: z.string().max(80),
  at: z.iso.datetime(),
  budgetUsd: z.number().min(0).max(1e5),
  spentUsd: z.number().min(0).max(1e5),
  entities: z
    .array(z.object({ id: z.string().max(40), path: z.string().max(300), records: count, fields: count }))
    .max(50),
  screens: z
    .array(
      z.object({
        screen: z.string().max(40),
        title: z.string().max(80),
        path: z.string().max(300).optional(),
        state: z.enum(["built", "proved", "different", "failed", "skipped"]),
        scenarios: count,
        costUsd: z.number().min(0).max(1e5).default(0),
        repairs: count.default(0),
        fieldsEqual: count.default(0),
        fieldsCompared: count.default(0),
        accepted: count.default(0),
        error: z.string().max(1000).optional(),
      }),
    )
    .max(200),
});
export type Board = z.infer<typeof BoardSchema>;

const STATE: Record<Board["screens"][number]["state"], { label: string; cls: string }> = {
  proved: { label: "Proved", cls: "on" },
  different: { label: "Differs", cls: "bad" },
  built: { label: "Built", cls: "part" },
  failed: { label: "Failed", cls: "bad" },
  skipped: { label: "Not built", cls: "gap" },
};

const CSS = `
.board { display: grid; gap: 16px; max-width: 1100px; }
.board table { width: 100%; border-collapse: collapse; font-size: 13px; }
.board th { text-align: left; color: var(--t3); font-weight: 500; padding: 10px 16px; border-bottom: 1px solid var(--line); }
.board td { padding: 12px 16px; border-bottom: 1px solid var(--line); vertical-align: top; }
.board tr:last-child td { border-bottom: 0; }
.board td.n { text-align: right; font-family: var(--mono); white-space: nowrap; }
.board .path { color: var(--t3); font-family: var(--mono); font-size: 12px; }
.board .err { color: var(--t3); font-size: 12px; margin-top: 4px; }
.pill { display: inline-flex; gap: 6px; align-items: center; font-size: 12px; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--line-2); }
.pill i { width: 6px; height: 6px; border-radius: 50%; background: var(--t3); }
.pill.on i { background: var(--green); } .pill.bad i { background: var(--red); } .pill.part i { background: var(--blue); }
`;

export function boardPage(b: Board): string {
  const proved = b.screens.filter((s) => s.state === "proved").length;
  const built = b.screens.filter((s) => s.state !== "skipped").length;
  const rows = b.screens
    .map((s) => {
      const st = STATE[s.state];
      const fields = s.fieldsCompared ? `${s.fieldsEqual} / ${s.fieldsCompared}` : "–";
      return `<tr><td><b>${esc(s.title)}</b><div class="path">${esc(s.path ?? "")}</div>${
        s.error ? `<div class="err">${esc(s.error)}</div>` : ""
      }</td><td><span class="pill ${st.cls}"><i></i>${st.label}</span></td><td class="n">${Number(s.scenarios)}</td><td class="n">${fields}</td><td class="n">${Number(s.repairs)}</td><td class="n">$${Number(s.costUsd).toFixed(2)}</td></tr>`;
    })
    .join("");
  const entities = b.entities
    .map(
      (e) =>
        `<tr><td><b>${esc(e.id)}</b><div class="path">${esc(e.path)}</div></td><td class="n">${Number(e.records)}</td><td class="n">${Number(e.fields)}</td></tr>`,
    )
    .join("");
  return shell({
    title: "Migration",
    run: b.name,
    active: "diff",
    css: CSS,
    body: `<div class="top"><span class="crumbs">Migration / <span class="run">${esc(b.name)}</span></span></div>
<div class="board">
<div class="meters">
<section class="card meter" aria-label="Screens proved">
  <header>Screens proved ${icon("check")}</header>
  <div class="big">${proved} / ${b.screens.length}<small>proved</small></div>
  ${ticks(
    [
      { n: proved, cls: "on" },
      { n: built - proved, cls: "part" },
      { n: b.screens.length - built, cls: "gap" },
    ],
    b.screens.length,
  )}
  <p>${esc(b.title)}: every screen replays the legacy app's scenarios on its migrated data.</p>
</section>
<section class="card meter" aria-label="Spend">
  <header>Spent on this migration ${icon("send")}</header>
  <div class="big">$${b.spentUsd.toFixed(2)}<small>of $${b.budgetUsd.toFixed(2)}</small></div>
  ${ticks([{ n: b.spentUsd, cls: "on" }], Math.max(b.budgetUsd, 1e-9))}
  <p>Records and comparisons are plain code; only screen builds and repairs call Muse Code.</p>
</section>
</div>
<section class="card"><table><thead><tr><th>Screen</th><th>State</th><th class="n">Scenarios</th><th class="n">Fields equal</th><th class="n">Repairs</th><th class="n">Spend</th></tr></thead><tbody>${rows}</tbody></table></section>
<section class="card"><table><thead><tr><th>Migrated records</th><th class="n">Records</th><th class="n">Fields</th></tr></thead><tbody>${entities}</tbody></table></section>
</div>`,
  });
}
