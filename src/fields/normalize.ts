import type { FieldKind } from "./types";

const SYNONYMS: Record<string, string> = {
  qty: "quantity",
  amt: "amount",
  no: "number",
  num: "number",
  nr: "number",
  cust: "customer",
  client: "customer",
  desc: "description",
  descr: "description",
  addr: "address",
  tel: "phone",
  inv: "invoice",
  tps: "gst",
  tvq: "qst",
  pct: "percent",
  subtot: "subtotal",
  disc: "discount",
  bal: "balance",
};

const STOPWORDS = new Set(["the", "of", "a", "an", "de", "du", "la", "le", "les"]);

export function labelTokens(label: string): string[] {
  const text = label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/sub[\s-]+total/g, "subtotal")
    .replace(/#/g, " number ")
    .replace(/[^a-z0-9.]+/g, " ");
  return text
    .split(" ")
    .map((t) => t.replace(/\.+$/, ""))
    .filter((t) => t && !STOPWORDS.has(t))
    .map((t) => SYNONYMS[t] ?? t);
}

export interface Normalized {
  kind: FieldKind;
  /** Canonical form used for comparison: cents for money, ISO date, lowercased text. */
  value: string;
}

const MONEY = /^[-+(]?(?:[$€£]\s?)?[-+]?\d{1,3}(?:[ ,. ]\d{3})*(?:[.,]\d{1,4})?(?:\s?[$€£])?\)?$/;
/** Displayed values longer than this are compared as plain text; keeps every pattern below linear. */
export const MAX_VALUE_LENGTH = 64;
const PLAIN_NUMBER = /^[-+]?\d+([.,]\d+)?$/;
const PERCENT = /^[-+]?\d+([.,]\d+)?\s*%$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const SLASH_DATE = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/;

function decimalOf(raw: string): number {
  let s = raw.replace(/[$€£\s ()]/g, "");
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  if (lastDot >= 0 && lastComma >= 0) {
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma >= 0) {
    const decimals = s.length - lastComma - 1;
    s = decimals === 3 ? s.replace(/,/g, "") : s.replace(",", ".");
  }
  const n = Number(s);
  return raw.trim().startsWith("(") ? -n : n;
}

/** Detect the kind of a displayed value. `dateOrder` resolves 03/04/2026 (default month first, as in VS3). */
export function normalizeValue(raw: string, hint?: FieldKind, dateOrder: "mdy" | "dmy" = "mdy"): Normalized {
  const s = raw.trim();
  const kind = s.length > MAX_VALUE_LENGTH ? "text" : (hint ?? inferKind(s));
  switch (kind) {
    case "money":
      return { kind, value: String(Math.round(decimalOf(s) * 100)) };
    case "number":
      return { kind, value: String(decimalOf(s)) };
    case "percent":
      return { kind, value: String(decimalOf(s.replace("%", ""))) };
    case "date": {
      const iso = ISO_DATE.exec(s);
      if (iso) return { kind, value: `${iso[1]}-${iso[2]}-${iso[3]}` };
      const m = SLASH_DATE.exec(s);
      if (!m) return { kind: "text", value: s.toLowerCase() };
      const [a, b] = [Number(m[1]), Number(m[2])];
      const [month, day] = dateOrder === "mdy" ? [a, b] : [b, a];
      return { kind, value: `${m[3]}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` };
    }
    case "bool":
      return { kind, value: String(/^(true|yes|oui|on|checked|x|1)$/i.test(s)) };
    case "text":
      return { kind, value: s.replace(/\s+/g, " ").toLowerCase() };
  }
}

export function inferKind(raw: string): FieldKind {
  const s = raw.trim();
  if (s.length > MAX_VALUE_LENGTH) return "text";
  if (PERCENT.test(s)) return "percent";
  if (ISO_DATE.test(s) || SLASH_DATE.test(s)) return "date";
  if (/^(true|false|yes|no|checked|unchecked)$/i.test(s)) return "bool";
  if (/[$€£]/.test(s) && MONEY.test(s)) return "money";
  if (/^[-+(]?\d{1,3}([ ,. ]\d{3})*[.,]\d{2}\)?$/.test(s)) return "money";
  if (PLAIN_NUMBER.test(s)) return "number";
  return "text";
}
