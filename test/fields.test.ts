import { describe, expect, test } from "bun:test";
import { labelSimilarity, matchScreens, pairScore } from "../src/fields/match";
import { inferKind, labelTokens, normalizeValue } from "../src/fields/normalize";
import { vs3Invoice, webInvoice } from "./fixtures/screens";

describe("normalizeValue", () => {
  test("money in any display form compares in cents", () => {
    expect(normalizeValue("69.21").value).toBe("6921");
    expect(normalizeValue("$69.22").value).toBe("6922");
    expect(normalizeValue("1 234,56 €").value).toBe("123456");
    expect(normalizeValue("1,234.56", "money").value).toBe("123456");
    expect(normalizeValue("(5.00)", "money").value).toBe("-500");
  });

  test("dates in VS3 and ISO form are the same date", () => {
    expect(normalizeValue("10/30/2026").value).toBe("2026-10-30");
    expect(normalizeValue("2026-10-30").value).toBe("2026-10-30");
    expect(normalizeValue("03/04/2026", "date", "dmy").value).toBe("2026-04-03");
  });

  test("kinds are inferred from the displayed value", () => {
    expect(inferKind("59.94")).toBe("money");
    expect(inferKind("3")).toBe("number");
    expect(inferKind("9.975%")).toBe("percent");
    expect(inferKind("Nantes Builders")).toBe("text");
  });
});

describe("labels", () => {
  test("abbreviations, punctuation and accents are folded", () => {
    expect(labelTokens("Invoice #")).toEqual(["invoice", "number"]);
    expect(labelTokens("Sub Total:")).toEqual(["subtotal"]);
    expect(labelTokens("Qty")).toEqual(["quantity"]);
    expect(labelTokens("Numéro de facture")).toEqual(["numero", "facture"]);
  });

  test("a label contained in a longer one still scores high", () => {
    expect(labelSimilarity("GST (5%)", "Federal tax (GST 5%)")).toBeGreaterThanOrEqual(0.85);
    expect(labelSimilarity("Total", "Subtotal")).toBeLessThan(0.85);
  });
});

describe("matchScreens on the VS3 invoice", () => {
  const result = matchScreens(vs3Invoice, webInvoice, {
    mapping: { "l-customer": "r-billto", "l-amount": "r-linetotal" },
  });
  const pairOf = (legacyId: string) => result.matches.find((m) => m.legacy.id === legacyId)?.rebuilt.id;

  test("every legacy field finds its rebuilt counterpart", () => {
    expect(result.unmatchedLegacy).toEqual([]);
    expect(result.unmatchedRebuilt).toEqual([]);
    expect(pairOf("l-sub")).toBe("r-sub");
    expect(pairOf("l-gst")).toBe("r-gst");
    expect(pairOf("l-qst")).toBe("r-qst");
    expect(pairOf("l-total")).toBe("r-total");
    expect(pairOf("l-number")).toBe("r-number");
    expect(pairOf("l-qty")).toBe("r-qty");
    expect(pairOf("l-price")).toBe("r-price");
    expect(pairOf("l-deposit")).toBe("r-deposit");
    expect(pairOf("l-balance")).toBe("r-balance");
  });

  test("the one-cent total is matched, then differs once normalized", () => {
    const total = result.matches.find((m) => m.legacy.id === "l-total");
    expect(total).toBeDefined();
    if (!total) return;
    expect(normalizeValue(total.legacy.value).value).toBe("6921");
    expect(normalizeValue(total.rebuilt.value).value).toBe("6922");
  });

  test("without a mapping, fields with unrelated labels stay unmatched instead of being guessed", () => {
    const bare = matchScreens(vs3Invoice, webInvoice);
    expect(bare.unmatchedLegacy.map((f) => f.id)).toContain("l-customer");
    expect(bare.matches.find((m) => m.legacy.id === "l-customer")).toBeUndefined();
  });

  test("matching ignores values, so a wrong value can never cause or prevent a pair", () => {
    const [l] = vs3Invoice.fields.filter((f) => f.id === "l-total");
    const [r] = webInvoice.fields.filter((f) => f.id === "r-total");
    if (!l || !r) throw new Error("fixture");
    expect(pairScore(l, r)).toBe(pairScore(l, { ...r, value: "$1,000.00" }));
  });

  test("the result is deterministic", () => {
    const again = matchScreens(vs3Invoice, webInvoice, {
      mapping: { "l-customer": "r-billto", "l-amount": "r-linetotal" },
    });
    expect(again).toEqual(result);
  });

  test("a mapping to a missing field is an error", () => {
    expect(() => matchScreens(vs3Invoice, webInvoice, { mapping: { "l-total": "nope" } })).toThrow();
  });
});
