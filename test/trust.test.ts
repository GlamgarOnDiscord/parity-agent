import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Capture } from "../src/capture/capture";
import { coverageOf, exploredOf } from "../src/coverage/coverage";
import { playwrightSpec } from "../src/export/playwright";
import { Ledger } from "../src/models/ledger";
import { type Proof, ProofSchema } from "../src/proof/schema";
import type { Rule } from "../src/rules/extract";
import { RuleStore } from "../src/rules/store";
import { createApp } from "../src/server/app";
import { diffPage } from "../src/server/diff";
import { openDb } from "../src/store/db";

const screen = (fields: [string, string][]) => ({
  id: "s",
  app: "legacy",
  fields: fields.map(([label, value], i) => ({ id: `f${i}`, label, value })),
});

const capture: Capture = {
  video: "recording.mp4",
  duration: 10,
  transcript: [],
  frames: [
    {
      t: 0,
      path: "f1.png",
      objects: [],
      screen: screen([
        ["Code", ""],
        ["Discount:", "0.00 $"],
      ]),
    },
    {
      t: 5,
      path: "f2.png",
      objects: [],
      screen: screen([
        ["Sub-total:", "59.94 $"],
        ["Total:", "69.21 $"],
        ["Printed at", "10:02"],
      ]),
    },
  ],
};

const proof: Proof = ProofSchema.parse({
  format: "parity-proof",
  version: 1,
  createdAt: "2026-10-26T00:00:00Z",
  reference: { app: "legacy", source: "capture" },
  scenarios: [
    {
      id: "sc",
      name: "One line",
      steps: [
        { do: "open", path: "/" },
        { do: "fill", field: "Code", value: "HW001" },
        { do: "click", target: "Add line" },
        { do: "check", screen: "frame-2", note: "after the line" },
      ],
    },
  ],
  checkpoints: [
    {
      scenario: "sc",
      step: 3,
      screen: screen([
        ["Total:", "69.21 $"],
        ["Printed at", "10:02"],
      ]),
    },
  ],
  volatile: ["Printed at"],
});

const rule = (id: string, target: string, fields: string[]): Rule => ({
  id,
  title: id,
  statement: "",
  kind: "computation",
  target,
  fields,
  evidence: { frames: [], quotes: [] },
  escalated: false,
  model: "m",
  confidence: 1,
});

describe("coverage map", () => {
  const cov = coverageOf(capture, proof, [rule("R-01", "Sub-total", ["Code"])]);
  const state = (label: string) => cov.rows.find((r) => r.label === label)?.state;

  test("labels are merged without case or trailing colons", () => {
    expect(cov.rows.filter((r) => r.label === "Total")).toHaveLength(1);
  });

  test("checked, rule only and never tested are told apart", () => {
    expect(state("Total")).toBe("tested");
    expect(state("Sub-total")).toBe("ruled");
    expect(state("Discount")).toBe("seen");
    expect(cov.counts).toEqual({ tested: 2, ruled: 2, seen: 1 });
  });

  test("gaps come first", () => {
    expect(cov.rows[0]?.state).toBe("seen");
  });
});

describe("what exploration added", () => {
  const withExplored: Proof = ProofSchema.parse({
    ...proof,
    scenarios: [
      ...proof.scenarios,
      {
        id: "explored-1a2b3c",
        name: "legacy: Price list (explored, step 2)",
        steps: [
          { do: "open", path: "/" },
          { do: "click", target: "Price list" },
          { do: "check", screen: "explored-1a2b3c" },
        ],
      },
    ],
    checkpoints: [
      ...proof.checkpoints,
      {
        scenario: "explored-1a2b3c",
        step: 2,
        screen: screen([
          ["Unit price:", "300.00"],
          ["Tax rate", "5%"],
          ["Total", "1.00"],
          ["Discount", "0"],
        ]),
      },
    ],
  });

  test("counts the scenarios and screens it wrote, and the fields no recording or person showed", () => {
    expect(exploredOf(withExplored, capture)).toEqual({
      scenarios: 1,
      screens: 1,
      fields: ["Tax rate", "Unit price"],
    });
    expect(exploredOf(withExplored).fields).toEqual(["Discount", "Tax rate", "Unit price"]);
    expect(exploredOf(proof)).toEqual({ scenarios: 0, screens: 0, fields: [] });
  });

  test("the diff screen says it, also for a run with no recording, and marks explored checkpoints", () => {
    const diff = (c: Proof["checkpoints"][number]) => ({
      fields: c.screen.fields.map((f) => ({ legacy: f, rebuilt: f, verdict: "equal" as const })),
      missingInRebuilt: [],
      extraInRebuilt: [],
      counts: { equal: c.screen.fields.length, different: 0, masked: 0, missing: 0, accepted: 0 },
    });
    const html = diffPage({
      run: "fa",
      proof: withExplored,
      saved: {
        result: {
          volatile: [],
          equal: true,
          checkpoints: withExplored.checkpoints.map((c) => ({
            scenario: c.scenario,
            step: c.step,
            screen: c.screen.id,
            diff: diff(c),
          })),
        },
        candidate: "generated/fa/app",
        at: "2026-10-30T00:00:00Z",
        evidence: {},
      } as never,
      explored: exploredOf(withExplored),
      calls: { calls: 0, costUsd: 0, sentBytes: 0 },
      budgetUsd: 20,
    });
    expect(html).toContain("1<small>screens explored</small>");
    expect(html).toContain("exploration wrote <b>1</b> scenario, <b>3</b> fields no person recorded");
    expect(html).toContain("explored</small>");
  });
});

describe("Playwright export", () => {
  const spec = playwrightSpec(proof);

  test("replays the steps with role and label locators", () => {
    expect(spec).toContain('await page.goto("/");');
    expect(spec).toContain('await fillField(page, "Code", "HW001");');
    expect(spec).toContain('await press(page, "Add line");');
  });

  test("checks the recorded values and skips volatile fields", () => {
    expect(spec).toContain('[["Total:","69.21 $",null]]');
    expect(spec).not.toContain("10:02");
  });

  test("a note cannot leave its comment, whatever line terminator it carries", () => {
    for (const nl of ["\n", "\r", "\u2028", "\u2029"]) {
      const noted = ProofSchema.parse({
        ...proof,
        scenarios: [
          { id: "n", name: "n", steps: [{ do: "check", screen: "s", note: `x${nl}process.exit(1)` }] },
        ],
        checkpoints: [],
      });
      const line = playwrightSpec(noted)
        .split(/\r\n|[\n\r\u2028\u2029]/)
        .find((l) => l.includes("process.exit"));
      expect(line?.trim().startsWith("//")).toBe(true);
    }
  });

  test("carries the same field reader as Parity", () => {
    expect(spec).toContain("const scanPage = function scanPage(");
  });

  test("quotes hostile text instead of running it", () => {
    const evil = ProofSchema.parse({
      ...proof,
      scenarios: [
        // biome-ignore lint/suspicious/noTemplateCurlyInString: text of generated code
        { id: "x", name: 'a"); process.exit(1); ("', steps: [{ do: "fill", field: "`${x}`", value: "\n" }] },
      ],
      checkpoints: [],
    });
    const out = playwrightSpec(evil);
    expect(out).toContain('test("a\\"); process.exit(1); (\\"",');
    // biome-ignore lint/suspicious/noTemplateCurlyInString: text of generated code
    expect(out).toContain('fillField(page, "`${x}`", "\\n")');
  });
});

describe("trust API", () => {
  const dir = mkdtempSync(join(tmpdir(), "parity-runs-"));
  mkdirSync(join(dir, "inv"));
  writeFileSync(join(dir, "inv", "capture.json"), JSON.stringify(capture));
  writeFileSync(join(dir, "inv", "proof.json"), JSON.stringify(proof));
  const db = openDb(":memory:");
  const ledger = new Ledger(db);
  ledger.record({
    runId: "inv",
    role: "structured",
    provider: "meta",
    model: "muse-spark-1.3",
    usage: { inputTokens: 1000, outputTokens: 100 },
    sentBytes: 2048,
    durationMs: 10,
    ok: true,
  });
  ledger.record({
    runId: "rebuild-inv",
    role: "code",
    provider: "meta",
    model: "muse-spark-1.3",
    usage: { inputTokens: 1000, outputTokens: 100 },
    sentBytes: 1024,
    durationMs: 10,
    ok: true,
  });
  ledger.record({
    runId: "other",
    role: "code",
    provider: "meta",
    model: "muse-spark-1.3",
    usage: { inputTokens: 1000 },
    sentBytes: 9999,
    durationMs: 10,
    ok: true,
  });
  const app = createApp(ledger, {
    token: "t-0123456789abcdef",
    port: 8787,
    rules: new RuleStore(db),
    runsDir: dir,
  });
  const get = (path: string, auth = true) =>
    app.request(`http://127.0.0.1:8787${path}`, {
      headers: { host: "127.0.0.1:8787", ...(auth ? { authorization: "Bearer t-0123456789abcdef" } : {}) },
    });

  test("coverage is served for a run and needs the session", async () => {
    expect((await get("/api/runs/inv/coverage", false)).status).toBe(401);
    const res = await get("/api/runs/inv/coverage");
    expect(res.status).toBe(200);
    expect((await res.json()).counts.tested).toBe(2);
    expect((await get("/api/runs/missing/coverage")).status).toBe(404);
    expect((await get("/api/runs/..%2F..%2Fetc/coverage")).status).toBe(400);
  });

  test("the send log of a run covers its capture and its rebuilds, nothing else", async () => {
    const body = await (await get("/api/runs/inv/calls")).json();
    expect(body.calls).toHaveLength(2);
    expect(body.total.sentBytes).toBe(3072);
  });

  test("cleanup", () => rmSync(dir, { recursive: true, force: true }));
});
