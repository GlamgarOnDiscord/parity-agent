// Kept free of imports and outer references: it is serialized with toString() into pages and exported test files.
export interface RawField {
  label: string;
  value: string;
  box: { x: number; y: number; w: number; h: number };
  group?: string;
}

/**
 * Runs in the page. Without `find`: every labelled value on screen. With `find`: the form control whose label
 * equals it (ignoring case and a trailing colon), else the first whose label contains it.
 *
 * Labels come from, in order: `data-field` or `aria-label`, a `<label>`, then the table around the control (a
 * `td.label` cell or the cell before it in the same row, else its column header), then `placeholder` or `name`.
 * Old business apps lay forms out in tables, so read-only values are also read from tables: a number next to a
 * text cell in the same row, or any cell of a grid with a header row.
 */
export function scanPage(find?: string): RawField[] | Element | null {
  const vw = window.innerWidth || 1;
  const vh = window.innerHeight || 1;
  const clean = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
  const key = (s: string) => clean(s).replace(/:$/, "").toLowerCase();
  const VALUE = /^[-+(]?[$€£]?\s?\d[\d,.\s]*%?\)?\s?[$€£]?$|^\d{1,4}[/.-]\d{1,2}[/.-]\d{1,4}$/;
  const CONTROLS =
    "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=image]):not([type=reset]), select, textarea";
  const visible = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 || r.height > 0;
  };
  const isText = (cell: Element) => {
    const t = clean(cell.textContent);
    return t !== "" && !VALUE.test(t) && !cell.querySelector(`${CONTROLS}, button, a`);
  };
  // A row that labels a value across several columns, like a totals line under a grid.
  const isFooter = (row: HTMLTableRowElement) => [...row.cells].some((c) => c.colSpan > 1 && isText(c));
  const headRow = (table: HTMLTableElement) =>
    [...table.rows].find((r) => r.closest("table") === table && r.querySelector("th, td.tableheader"));
  const headerOf = (cell: HTMLTableCellElement): string => {
    const table = cell.closest("table");
    if (!table) return "";
    const head = headRow(table);
    if (!head || head === cell.parentElement) return "";
    let col = 0;
    for (const c of [...(cell.parentElement as HTMLTableRowElement).cells]) {
      if (c === cell) break;
      col += c.colSpan;
    }
    let at = 0;
    for (const h of [...head.cells]) {
      if (col >= at && col < at + h.colSpan) return clean(h.textContent);
      at += h.colSpan;
    }
    return "";
  };
  const tableLabel = (el: Element): string => {
    const cell = el.closest("td, th") as HTMLTableCellElement | null;
    const row = cell?.parentElement as HTMLTableRowElement | null;
    if (!cell || !row || row.tagName !== "TR") return "";
    const cells = [...row.cells];
    const before = cells.slice(0, cells.indexOf(cell)).reverse();
    const marked = before.find((c) => c.classList.contains("label"));
    if (marked) return clean(marked.textContent);
    const prev = before.find(
      (c) => clean(c.textContent) !== "" || c.querySelector("input, select, textarea"),
    );
    const pair = prev && isText(prev) ? clean(prev.textContent) : "";
    const table = row.closest("table");
    const grid = table && headRow(table) && !isFooter(row);
    return grid ? headerOf(cell) || pair : pair || headerOf(cell);
  };
  const labelOf = (el: Element): string =>
    clean(
      el.getAttribute("data-field") ??
        el.getAttribute("aria-label") ??
        (el as HTMLInputElement).labels?.[0]?.textContent ??
        (tableLabel(el) || el.getAttribute("placeholder") || el.getAttribute("name") || ""),
    );

  if (find !== undefined) {
    const needle = key(find);
    const controls = [...document.querySelectorAll(CONTROLS)].filter(visible);
    const names = controls.map((el) =>
      [labelOf(el), el.getAttribute("aria-label"), el.getAttribute("placeholder")].map((n) => key(n ?? "")),
    );
    const exact = controls.find((_, i) => names[i]?.includes(needle));
    return exact ?? controls.find((_, i) => names[i]?.some((n) => n !== "" && n.includes(needle))) ?? null;
  }

  const readValue = (el: Element): string => {
    if (el instanceof HTMLInputElement) return el.type === "checkbox" ? String(el.checked) : el.value;
    if (el instanceof HTMLSelectElement) return el.selectedOptions[0]?.textContent ?? el.value;
    if (el instanceof HTMLTextAreaElement || el instanceof HTMLOutputElement) return el.value;
    return el.textContent ?? "";
  };
  // Rows of a grid are numbered among data rows only; the row holding input controls is the entry row.
  const gridGroup = (el: Element): string | undefined => {
    const row = el.closest("tr");
    const table = row?.closest("table");
    const head = table ? headRow(table) : undefined;
    if (!row || !table || !head || row === head || head.cells.length < 2 || isFooter(row)) return undefined;
    if (row.querySelector(CONTROLS)) return "entry";
    const data = [...table.rows].filter(
      (r) => r.closest("table") === table && r !== head && !isFooter(r) && !r.querySelector(CONTROLS),
    );
    return `row-${data.indexOf(row) + 1}`;
  };
  const out: RawField[] = [];
  const push = (el: Element, label: string, value: string, group = gridGroup(el)) => {
    const r = el.getBoundingClientRect();
    out.push({
      label,
      value: clean(value),
      box: { x: r.x / vw, y: r.y / vh, w: r.width / vw, h: r.height / vh },
      group: el.closest("[data-group]")?.getAttribute("data-group") ?? group,
    });
  };

  for (const el of new Set(document.querySelectorAll(`[data-field], output, ${CONTROLS}`))) {
    if (!visible(el)) continue;
    const label = labelOf(el);
    if (label) push(el, label, readValue(el));
  }

  for (const table of document.querySelectorAll("table")) {
    if (table.closest("[data-field]") || !visible(table)) continue;
    const rows = [...table.rows].filter((r) => r.closest("table") === table);
    const head = headRow(table);
    for (const row of rows) {
      if (row === head) continue;
      const cells = [...row.cells];
      cells.forEach((cell, i) => {
        if (cell.querySelector("table, [data-field]") || cell.querySelector(CONTROLS) || !visible(cell))
          return;
        const text = clean(cell.textContent);
        if (!text || cell.classList.contains("label")) return;
        const grid = head && head.cells.length > 1 && !isFooter(row);
        if (!grid && VALUE.test(text)) {
          const prev = cells
            .slice(0, i)
            .reverse()
            .find((c) => clean(c.textContent) !== "" || c.querySelector("input, select, textarea"));
          if (prev && isText(prev)) {
            push(cell, clean(prev.textContent), text, undefined);
            return;
          }
        }
        // A grid row under a header row: every cell is a field, grouped by row.
        if (grid) {
          const label = headerOf(cell);
          if (label) push(cell, label, text);
        }
      });
    }
  }
  return out;
}
