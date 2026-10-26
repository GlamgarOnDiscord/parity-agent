// Kept free of imports: it is serialized with toString() into pages and exported test files.
export interface RawField {
  label: string;
  value: string;
  box: { x: number; y: number; w: number; h: number };
  group?: string;
}

/** Runs in the page: every labelled value on screen. Explicit `data-field` wins; otherwise form controls. */
export function collectFields(): RawField[] {
  const vw = window.innerWidth || 1;
  const vh = window.innerHeight || 1;
  const labelOf = (el: Element): string => {
    const explicit = el.getAttribute("data-field") ?? el.getAttribute("aria-label");
    if (explicit) return explicit;
    const fromLabel = (el as HTMLInputElement).labels?.[0]?.textContent;
    if (fromLabel) return fromLabel;
    return el.getAttribute("placeholder") ?? el.getAttribute("name") ?? "";
  };
  const fieldValue = (el: Element): string => {
    if (el instanceof HTMLInputElement) return el.type === "checkbox" ? String(el.checked) : el.value;
    if (el instanceof HTMLSelectElement) return el.selectedOptions[0]?.textContent ?? el.value;
    if (el instanceof HTMLTextAreaElement || el instanceof HTMLOutputElement) return el.value;
    return el.textContent ?? "";
  };
  const out: RawField[] = [];
  const nodes = document.querySelectorAll("[data-field], input:not([type=hidden]), select, textarea, output");
  for (const el of new Set(nodes)) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const label = labelOf(el).replace(/\s+/g, " ").trim();
    if (!label) continue;
    out.push({
      label,
      value: fieldValue(el).replace(/\s+/g, " ").trim(),
      box: { x: r.x / vw, y: r.y / vh, w: r.width / vw, h: r.height / vh },
      group: el.closest("[data-group]")?.getAttribute("data-group") ?? undefined,
    });
  }
  return out;
}
