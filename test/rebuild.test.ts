import { describe, expect, test } from "bun:test";
import type { Capture } from "../src/capture/capture";
import { proofFromCapture } from "../src/capture/scenario";
import type { ModelClients } from "../src/models/types";
import { ProofSchema } from "../src/proof/schema";
import { writeSpec } from "../src/rebuild/spec";

const field = (label: string, value: string) => ({ id: label.toLowerCase(), label, value });
const frame = (t: number, values: Record<string, string>) => ({
  t,
  path: "scripts/sample-field.png",
  objects: [],
  screen: {
    id: `f${t}`,
    app: "a",
    title: "Invoice",
    fields: Object.entries(values).map(([l, v]) => field(l, v)),
  },
});
const empty = { Item: "", Quantity: "", Total: "", Subtotal: "", "Unit price": "" };
const capture: Capture = {
  video: "v.mp4",
  duration: 9,
  transcript: [],
  frames: [
    frame(0, empty),
    frame(3, { ...empty, Item: "HW001" }),
    frame(5, { ...empty, Item: "HW001", Quantity: "3" }),
    frame(8, { Item: "HW001", Quantity: "3", "Unit price": "$19.98", Subtotal: "$59.94", Total: "$69.21" }),
  ],
};
let asked = 0;
const models = {
  structured: {
    provider: "fake",
    model: "fake",
    generate: async () => {
      asked++;
      return { value: { button: "Compute" }, call: {} };
    },
  },
} as unknown as ModelClients;

describe("proofFromCapture", () => {
  test("typed values become fills, a burst of computed values becomes a click and a checkpoint", async () => {
    const proof = ProofSchema.parse(
      await proofFromCapture(capture, models, { id: "s", name: "n", app: "legacy" }),
    );
    expect(proof.reference.source).toBe("capture");
    expect(proof.scenarios[0]?.steps).toEqual([
      { do: "open", path: "/" },
      { do: "fill", field: "Item", value: "HW001" },
      { do: "fill", field: "Quantity", value: "3" },
      { do: "click", target: "Compute" },
      { do: "check", screen: "frame-4", note: "after Compute" },
    ]);
    expect(proof.checkpoints[0]?.step).toBe(4);
    expect(proof.checkpoints[0]?.screen.fields.find((f) => f.label === "Total")?.value).toBe("$69.21");
    expect(asked).toBe(1);
  });

  test("the spec carries the rules, the exact values and the item price seen on screen", async () => {
    const proof = await proofFromCapture(capture, models, { id: "s", name: "n", app: "legacy" });
    const spec = writeSpec(capture, proof, [
      {
        id: "R-04",
        title: "Invoice total",
        statement: "Round once at the end.",
        kind: "computation",
        target: "Total",
        expression: "round({Subtotal} * 1.05 * 1.09975, 2)",
        fields: [],
        evidence: { frames: [], quotes: [] },
        escalated: false,
        model: "m",
        confidence: 1,
      },
    ]);
    expect(spec).toContain("`Total = round({Subtotal} * 1.05 * 1.09975, 2)`");
    expect(spec).toContain("`Total` = `$69.21`");
    expect(spec).toContain('Item "HW001" -> Unit price `$19.98`');
    expect(spec).not.toContain('Quantity "3" -> Unit price');
  });
});

describe("repair prompt", () => {
  test("ties every difference to the inputs that produced it and to its line", async () => {
    const { repairPrompt } = await import("../src/rebuild/rebuild");
    const { diffScreens } = await import("../src/diff/diff");
    const { matchScreens } = await import("../src/fields/match");
    const proof = ProofSchema.parse({
      format: "parity-proof",
      version: 1,
      createdAt: "2026-10-28T00:00:00Z",
      reference: { app: "ref", source: "replay" },
      scenarios: [
        {
          id: "inv-fuzz-a1",
          name: "one service line",
          steps: [
            { do: "open", path: "/" },
            { do: "fill", field: "Item Code", value: "202" },
            { do: "click", target: "Add Item" },
            { do: "check", screen: "inv-fuzz-a1" },
          ],
        },
      ],
      checkpoints: [],
    });
    const line = (value: string) => ({ id: "d", label: "Item Description", value, group: "row-1" });
    const diff = diffScreens(
      matchScreens(
        { id: "s", app: "a", fields: [line("Maintenance")] },
        { id: "s", app: "b", fields: [line("iPhone 6 64GB")] },
      ),
    );
    const prompt = repairPrompt(
      { volatile: [], equal: false, checkpoints: [{ scenario: "inv-fuzz-a1", step: 3, screen: "s", diff }] },
      proof,
    );
    expect(prompt).toContain("after: Item Code = 202; click Add Item");
    expect(prompt).toContain("`Item Description` (line row-1): the legacy app shows `Maintenance`");
  });
});
