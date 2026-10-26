import { describe, expect, test } from "bun:test";
import { diffScreens } from "../src/diff/diff";
import { matchScreens } from "../src/fields/match";
import type { Screen } from "../src/fields/types";
import { ProofSchema } from "../src/proof/schema";
import type { ProveResult } from "../src/replay/prove";
import { renderReport } from "../src/report/report";

// A 1x1 PNG: enough for the header the zoom reads.
const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" as const;

const screen = (app: string, total: string, label = "Total"): Screen => ({
  id: "frame-4",
  app,
  fields: [
    { id: "t", label, value: total, box: { x: 0.7, y: 0.9, w: 0.05, h: 0.02 } },
    { id: "s", label: "Sub-total", value: "59.94" },
  ],
});

const proof = ProofSchema.parse({
  format: "parity-proof",
  version: 1,
  createdAt: "2026-10-26T00:00:00Z",
  reference: { app: "Virtual Salesman 3", source: "capture" },
  scenarios: [{ id: "sc", name: "Invoice", steps: [{ do: "check", screen: "frame-4" }] }],
  checkpoints: [{ scenario: "sc", step: 0, screen: screen("legacy", "69.21") }],
});

function result(legacy: Screen, rebuilt: Screen): ProveResult {
  const diff = diffScreens(matchScreens(legacy, rebuilt));
  return {
    volatile: [],
    equal: diff.counts.different === 0 && diff.counts.missing === 0,
    checkpoints: [{ scenario: "sc", step: 0, screen: "frame-4", diff }],
  };
}

const base = {
  proof,
  candidate: "generated/vs3/app",
  rules: [],
  calls: { calls: 0, costUsd: 0, sentBytes: 0 },
  legacyImages: { "frame-4": PNG },
  rebuiltImages: { "sc:0": PNG },
  proofSha256: "ab".repeat(32),
  parityVersion: "test",
  generatedAt: new Date("2026-10-26T12:00:00Z"),
};

describe("proof report", () => {
  test("a difference leads, with both values and a zoom on the field from each screen", () => {
    const html = renderReport({
      ...base,
      result: result(screen("legacy", "69.21"), screen("rebuilt", "69.22")),
    });
    expect(html).toContain("No parity: 1 difference");
    expect(html).toContain(
      '<span class="before">69.21</span> before, <span class="after">69.22</span> after',
    );
    expect(html.match(/class="crop"/g)).toHaveLength(2);
    expect(html).toContain("2 fields compared over 1 checkpoint,");
  });

  test("parity says so and keeps the sign-off", () => {
    const html = renderReport({
      ...base,
      result: result(screen("legacy", "69.21"), screen("rebuilt", "69.21")),
    });
    expect(html).toContain('<p class="verdict ok">Parity</p>');
    expect(html).toContain("Name and role");
  });

  test("text from the apps is escaped", () => {
    const evil = '<img src=x onerror="alert(1)">';
    const html = renderReport({
      ...base,
      result: result(screen("legacy", evil, "Total"), screen("rebuilt", "69.22", "Total")),
    });
    expect(html).not.toContain(evil);
    expect(html).toContain("&#60;img src=x onerror=&#34;alert(1)&#34;&#62;");
  });

  test("nothing is fetched: no external URL, script or font", () => {
    const html = renderReport({
      ...base,
      result: result(screen("legacy", "69.21"), screen("rebuilt", "69.22")),
    });
    expect(html).not.toMatch(/https?:\/\//);
    expect(html).not.toContain("<script");
    expect(html).not.toContain("@import");
  });

  test("an image string that would break out of the CSS url() is left out", () => {
    const html = renderReport({
      ...base,
      legacyImages: { "frame-4": `${PNG});background:url(//evil.example/x)` as typeof PNG },
      result: result(screen("legacy", "69.21"), screen("rebuilt", "69.22")),
    });
    expect(html).not.toContain("evil.example");
  });

  test("an image that is not a PNG data URL is left out", () => {
    const html = renderReport({
      ...base,
      legacyImages: { "frame-4": "https://evil.example/x.png" as typeof PNG },
      result: result(screen("legacy", "69.21"), screen("rebuilt", "69.22")),
    });
    expect(html).not.toContain("evil.example");
    expect(html.match(/class="crop"/g)).toHaveLength(1);
  });
});
