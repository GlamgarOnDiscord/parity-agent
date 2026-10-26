import { describe, expect, test } from "bun:test";
import { evaluate, fieldsOf, parseExpr, roundHalfUp } from "../src/rules/expr";

const values: Record<string, number> = {
  "Sub Total": 59.94,
  "GST (5%)": 3,
  "QST (9.975%)": 6.28,
  Total: 69.21,
};
const lookup = (label: string) => values[label];

describe("expressions", () => {
  test("the tax-on-tax rule evaluates on captured values", () => {
    const qst = parseExpr("round(({Sub Total} + {GST (5%)}) * 0.09975, 2)");
    expect(evaluate(qst, lookup)).toBe(6.28);
    expect(fieldsOf(qst)).toEqual(["Sub Total", "GST (5%)"]);
  });

  test("the naive total is contradicted by the screen, the unrounded one is confirmed", () => {
    const naive = parseExpr("{Sub Total} + {GST (5%)} + {QST (9.975%)}");
    expect(roundHalfUp(evaluate(naive, lookup), 2)).toBe(69.22);
    const unrounded = parseExpr("round({Sub Total} * 1.05 + {Sub Total} * 1.05 * 0.09975, 2)");
    expect(evaluate(unrounded, lookup)).toBe(69.21);
  });

  test("half up rounding is decimal-safe", () => {
    expect(roundHalfUp(8.5 * 2.35, 2)).toBe(19.98);
    expect(roundHalfUp(-2.345, 2)).toBe(-2.35);
  });

  test("anything outside the language is rejected, nothing is executed", () => {
    for (const bad of [
      "process.exit(1)",
      "{a} ** 2",
      "constructor",
      "round({a}",
      "{}",
      "1 +",
      "x".repeat(600),
    ]) {
      expect(() => parseExpr(bad)).toThrow();
    }
  });

  test("a missing field or a division by zero is an error, not a silent number", () => {
    expect(() => evaluate(parseExpr("{Nope} + 1"), lookup)).toThrow(/no value/);
    expect(() => evaluate(parseExpr("1 / ({Total} - {Total})"), lookup)).toThrow(/zero/);
  });
});

describe("checkRule on captured frames", async () => {
  const { checkRule } = await import("../src/rules/extract");
  const capture = {
    video: "v.mp4",
    duration: 10,
    transcript: [],
    frames: [
      {
        t: 0,
        path: "f1.png",
        objects: [],
        screen: { id: "f1", app: "a", fields: [{ id: "t", label: "Total", value: "" }] },
      },
      {
        t: 5,
        path: "f2.png",
        objects: [],
        screen: {
          id: "f2",
          app: "a",
          fields: [
            { id: "s", label: "Subtotal", value: "$59.94" },
            { id: "g", label: "Federal tax (GST 5%)", value: "$3.00" },
            { id: "q", label: "Provincial tax (QST 9.975%)", value: "$6.28" },
            { id: "t", label: "Total", value: "$69.21" },
          ],
        },
      },
    ],
  };

  test("the naive sum is contradicted by the screen, with the frame as evidence", () => {
    const c = checkRule(
      capture,
      "Total",
      "{Subtotal} + {Federal tax (GST 5%)} + {Provincial tax (QST 9.975%)}",
    );
    expect(c.contradicted).toBe(1);
    expect(c.examples[0]).toEqual({ frame: 2, expected: "69.21", computed: "69.2200" });
    expect(c.untestable).toBe(1);
  });

  test("the unrounded total is verified", () => {
    const c = checkRule(capture, "Total", "round({Subtotal} * 1.05 + {Subtotal} * 1.05 * 0.09975, 2)");
    expect(c.verified).toBe(1);
    expect(c.contradicted).toBe(0);
  });

  test("a formula outside the language is reported, never run", () => {
    expect(checkRule(capture, "Total", "process.exit(1)").error).toBeDefined();
  });
});

describe("parseSam", async () => {
  const { parseSam } = await import("../src/capture/sam");
  test("boxes become screen-relative, masks are ignored", () => {
    const out = parseSam(
      "<0f>0<|box;x1=90;y1=70;x2=190;y2=100;w=320;h=120|><|mask;x=0;y=0;data=31,101,~!!|>",
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.box.x).toBeCloseTo(90 / 320);
    expect(out[0]?.box.h).toBeCloseTo(30 / 120);
    expect(parseSam("")).toEqual([]);
  });
});

describe("RuleStore", async () => {
  const { RuleStore } = await import("../src/rules/store");
  const { openDb } = await import("../src/store/db");
  test("decisions survive a re-extraction of the same run", () => {
    const store = new RuleStore(openDb(":memory:"));
    const rule = {
      id: "R-01",
      title: "QST on GST",
      statement: "s",
      kind: "computation" as const,
      fields: [],
      evidence: { frames: [], quotes: [] },
      escalated: false,
      model: "m",
      confidence: 0.9,
    };
    store.save("run1", [rule]);
    expect(store.decide("run1", "R-01", "accepted")?.status).toBe("accepted");
    store.save("run1", [{ ...rule, statement: "s2" }]);
    const [again] = store.list("run1");
    expect(again?.status).toBe("accepted");
    expect(again?.statement).toBe("s2");
    expect(store.decide("run1", "R-99", "rejected")).toBeNull();
  });
});

describe("sum over invoice lines", async () => {
  const { checkRule } = await import("../src/rules/extract");
  const { parseExpr } = await import("../src/rules/expr");
  const lines = {
    video: "v.mp4",
    duration: 1,
    transcript: [],
    frames: [
      {
        t: 0,
        path: "f.png",
        objects: [],
        screen: {
          id: "f",
          app: "a",
          fields: [
            { id: "a", label: "Total price", value: "59.94 $" },
            { id: "b", label: "Total price", value: "39.68 $" },
            { id: "c", label: "Price", value: "19.98 $" },
            { id: "d", label: "Sub-total:", value: "99.62 $" },
          ],
        },
      },
    ],
  };

  test("sum() adds every line with exactly that label, not look-alike columns", () => {
    expect(checkRule(lines, "Sub-total:", "sum({Total price})").verified).toBe(1);
  });

  test("sum() only takes a field reference", () => {
    expect(() => parseExpr("sum(1 + 2)")).toThrow();
  });
});
