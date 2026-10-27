import { afterAll, beforeAll, describe, expect, setDefaultTimeout, test } from "bun:test";
import { loadConfig } from "../src/config";
import { openBrowser } from "../src/drivers";
import type { AppDriver } from "../src/drivers/types";
import {
  type Case,
  caseScenario,
  type FuzzSpec,
  FuzzSpecSchema,
  generateCase,
  seeded,
  shrink,
} from "../src/fuzz/case";
import { addFailures, fuzz } from "../src/fuzz/fuzz";
import { type Proof, ProofSchema } from "../src/proof/schema";

// Chrome starts cold on CI runners; hooks that launch it need more than the default 5 s.
setDefaultTimeout(60_000);

const spec: FuzzSpec = FuzzSpecSchema.parse({
  id: "inv",
  name: "Invoice",
  line: [
    { field: "Item Code", oneOf: ["A", "B", "C"] },
    { field: "Quantity", int: [1, 99] },
    { field: "Note", oneOf: ["x", "y"], optional: 0.5 },
  ],
  add: "Add Item",
  lines: [1, 4],
});

describe("generated cases", () => {
  test("the same seed gives the same cases, inside the spec's bounds", () => {
    const a = [seeded(7), seeded(7)].map((r) => Array.from({ length: 20 }, () => generateCase(spec, r)));
    expect(a[0]).toEqual(a[1] as Case[]);
    for (const c of a[0] as Case[]) {
      expect(c.length).toBeGreaterThanOrEqual(1);
      expect(c.length).toBeLessThanOrEqual(4);
      for (const [item, qty, note] of c) {
        expect(["A", "B", "C"]).toContain(item as string);
        expect(Number(qty)).toBeGreaterThanOrEqual(1);
        expect(Number(qty)).toBeLessThanOrEqual(99);
        expect([null, "x", "y"]).toContain(note as string | null);
      }
    }
    expect(generateCase(spec, seeded(8))).not.toEqual(generateCase(spec, seeded(7)));
  });

  test("a case becomes a scenario that fills every line, adds it and checks once", () => {
    const s = caseScenario(spec, [["B", "3", null]], "case-1");
    expect(s.steps).toEqual([
      { do: "open", path: "/" },
      { do: "fill", field: "Item Code", value: "B" },
      { do: "fill", field: "Quantity", value: "3" },
      { do: "click", target: "Add Item" },
      { do: "check", screen: "case-1", note: "Item Code B, Quantity 3" },
    ]);
  });
});

describe("shrinking", () => {
  test("drops lines and optional inputs, and moves values to the simplest that still fails", async () => {
    // Fails whenever an item B is bought 37 or more times.
    const fails = async (c: Case) => c.some(([item, qty]) => item === "B" && Number(qty) >= 37);
    const { case: small } = await shrink(
      spec,
      [
        ["A", "50", "x"],
        ["B", "80", "y"],
        ["C", "2", null],
      ],
      fails,
    );
    expect(small).toEqual([["B", "37", null]]);
  });

  test("every case it keeps was seen failing, even under a run limit", async () => {
    const seen: Case[] = [];
    const fails = async (c: Case) => {
      seen.push(c);
      return c.length >= 2;
    };
    const { case: small, tries } = await shrink(
      spec,
      [
        ["C", "9", "y"],
        ["C", "9", "y"],
        ["C", "9", "y"],
      ],
      fails,
      3,
    );
    expect(tries).toBe(3);
    expect(small.length).toBe(2);
    expect(seen.some((c) => JSON.stringify(c) === JSON.stringify(small))).toBe(true);
  });
});

// Two apps that agree on the recorded item A and disagree on B, which the recording never showed: the reference
// prices it at 0, the rebuild falls back to 5.
const page = (prices: string, fallback: number) => `<!doctype html><title>Invoice</title>
<label>Item Code <input id="c"></label><label>Quantity <input id="q" value="1"></label>
<button type="button" id="add">Add Item</button>
<label>Sub-total <output data-field="Sub-total" id="t">0.00</output></label>
<script>
  const prices = ${prices}; let sum = 0;
  document.getElementById("add").onclick = () => {
    const code = document.getElementById("c").value.trim();
    const price = code in prices ? prices[code] : ${fallback};
    sum += price * Number(document.getElementById("q").value);
    document.getElementById("t").textContent = sum.toFixed(2);
    document.getElementById("c").value = ""; document.getElementById("q").value = "1";
  };
</script>`;

let servers: ReturnType<typeof Bun.serve>[] = [];
let reference: AppDriver;
let candidate: AppDriver;

beforeAll(async () => {
  servers = [page(`{"A": 10, "B": 0, "C": 2}`, 0), page(`{"A": 10, "C": 2}`, 5)].map((html) =>
    Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch: () => new Response(html, { headers: { "content-type": "text/html" } }),
    }),
  );
  const config = loadConfig();
  const [a, b] = servers.map((s) => openBrowser(config, { url: `http://127.0.0.1:${s.port}/` }));
  [reference, candidate] = await Promise.all([a as Promise<AppDriver>, b as Promise<AppDriver>]);
});

afterAll(async () => {
  await Promise.all([reference?.close(), candidate?.close()]);
  for (const s of servers) s.stop(true);
});

describe("differential fuzzing on two live apps", () => {
  const small = FuzzSpecSchema.parse({ ...spec, line: spec.line.slice(0, 2), lines: [1, 3] });

  test("finds the item the recording never showed and shrinks it to one line of one", async () => {
    const report = await fuzz({ reference, candidate }, small, { seed: 3, count: 8, maxFailures: 1 });
    expect(report.played).toBeGreaterThan(0);
    expect(report.failures).toHaveLength(1);
    const [f] = report.failures;
    expect(f?.case).toEqual([["B", "1"]]);
    expect(f?.result.signature).toEqual(["Sub-total"]);

    // The difference becomes a scenario of the proof, checked against what the reference showed.
    const proof: Proof = ProofSchema.parse({
      format: "parity-proof",
      version: 1,
      createdAt: "2026-10-28T00:00:00Z",
      reference: { app: "ref", source: "replay" },
      scenarios: [],
      checkpoints: [],
    });
    const once = addFailures(proof, small, report);
    expect(once.added).toEqual([`inv-fuzz-3-${f?.index}`]);
    expect(once.proof.checkpoints[0]?.screen.id).toBe(once.added[0] as string);
    expect(once.proof.checkpoints[0]?.screen.fields.find((x) => x.label === "Sub-total")?.value).toBe("0.00");
    expect(addFailures(once.proof, small, report).added).toEqual([]);
  });
});
