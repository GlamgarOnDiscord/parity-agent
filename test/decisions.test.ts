import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { applyDecisions, type Decision } from "../src/diff/decisions";
import { diffScreens } from "../src/diff/diff";
import { matchScreens } from "../src/fields/match";
import type { Screen } from "../src/fields/types";
import { Ledger } from "../src/models/ledger";
import { ProofSchema } from "../src/proof/schema";
import { summaryOf } from "../src/report/summary";
import { RuleStore } from "../src/rules/store";
import { createApp } from "../src/server/app";
import { RepairJobs } from "../src/server/repair";
import { openDb } from "../src/store/db";

const screen = (total: string, tax = "3.30"): Screen => ({
  id: "frame-4",
  app: "a",
  fields: [
    { id: "t", label: "Total", value: total },
    { id: "x", label: "Tax", value: tax },
  ],
});
const decision = (over: Partial<Decision> = {}): Decision => ({
  screen: "frame-4",
  field: "Total",
  legacy: "6921",
  rebuilt: "6922",
  kind: "legacy-bug",
  by: "Ana, finance",
  why: "The legacy app rounds once and loses a cent; per line is the law.",
  at: "2026-10-28T10:00:00Z",
  ...over,
});

describe("accepted differences", () => {
  const diff = diffScreens(matchScreens(screen("69.21"), screen("69.22", "3.31")));

  test("a decision turns its difference into an accepted one and leaves the others different", () => {
    const d = applyDecisions(diff, "frame-4", [decision()]);
    expect(d.counts).toMatchObject({ different: 1, accepted: 1, equal: 0 });
    expect(d.fields.find((f) => f.legacy.label === "Total")?.decision?.by).toBe("Ana, finance");
    expect(d.fields.find((f) => f.legacy.label === "Tax")?.verdict).toBe("different");
  });

  test("it holds for the two values the person saw, and for that screen only", () => {
    const later = diffScreens(matchScreens(screen("69.21"), screen("69.23")));
    expect(applyDecisions(later, "frame-4", [decision()]).counts.accepted).toBe(0);
    expect(applyDecisions(diff, "frame-5", [decision()]).counts.accepted).toBe(0);
  });

  test("the pull request summary lists it with who and why", () => {
    const d = applyDecisions(diffScreens(matchScreens(screen("69.21"), screen("69.22"))), "frame-4", [
      decision(),
    ]);
    const md = summaryOf("VS3", "app", {
      volatile: [],
      equal: true,
      checkpoints: [{ scenario: "sc", step: 0, screen: "frame-4", diff: d }],
    });
    expect(md).toContain("### Parity");
    expect(md).toContain("| Total | 69.21 | 69.22 | Ana, finance: The legacy app rounds once");
  });
});

// A run on disk, served by the real app, to accept and revoke from the diff screen's routes.
const proof = ProofSchema.parse({
  format: "parity-proof",
  version: 1,
  createdAt: "2026-10-26T00:00:00Z",
  reference: { app: "Virtual Salesman 3", source: "capture" },
  scenarios: [{ id: "sc", name: "invoice", steps: [{ do: "check", screen: "frame-4" }] }],
  checkpoints: [{ scenario: "sc", step: 0, screen: screen("69.21") }],
});
const dir = mkdtempSync(join(tmpdir(), "parity-decisions-"));
mkdirSync(join(dir, "inv"), { recursive: true });
writeFileSync(join(dir, "inv", "proof.json"), JSON.stringify(proof));
writeFileSync(
  join(dir, "inv", "result.json"),
  JSON.stringify({
    result: {
      volatile: [],
      equal: false,
      checkpoints: [
        {
          scenario: "sc",
          step: 0,
          screen: "frame-4",
          diff: diffScreens(matchScreens(screen("69.21"), screen("69.22", "3.31"))),
        },
      ],
    },
    candidate: "generated/inv/app",
    at: "2026-10-26T12:00:00Z",
    evidence: {},
    replay: { app: "generated/inv/app" },
  }),
);

const root = resolve(import.meta.dir, "..");
const started: string[][] = [];
const repairs = new RepairJobs(root, dir, (cmd) => {
  started.push(cmd);
  return {
    lines: (async function* () {
      yield "repair 1: $0.000  PARITY";
    })(),
    exited: Promise.resolve(0),
  };
});
const db = openDb(":memory:");
const app = createApp(new Ledger(db), {
  token: "t-0123456789abcdef",
  port: 8787,
  rules: new RuleStore(db),
  runsDir: dir,
  repairs,
});
const call = (path: string, body?: unknown) =>
  app.request(`http://127.0.0.1:8787${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      host: "127.0.0.1:8787",
      authorization: "Bearer t-0123456789abcdef",
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const accept = {
  scenario: "sc",
  step: 0,
  field: "Total",
  kind: "legacy-bug",
  by: "Ana, finance",
  why: "Per line rounding is the law.",
};

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("deciding from the diff screen", () => {
  test("accepting stores who and why in the proof and updates the last replay", async () => {
    const r = await call("/api/runs/inv/decisions", accept);
    expect(r.status).toBe(200);
    expect((await r.json()).equal).toBe(false);
    const saved = ProofSchema.parse(JSON.parse(readFileSync(join(dir, "inv", "proof.json"), "utf8")));
    expect(saved.decisions).toHaveLength(1);
    expect(saved.decisions[0]).toMatchObject({
      field: "Total",
      legacy: "6921",
      rebuilt: "6922",
      by: "Ana, finance",
    });
    const result = JSON.parse(readFileSync(join(dir, "inv", "result.json"), "utf8")).result;
    expect(result.checkpoints[0].diff.counts).toMatchObject({ accepted: 1, different: 1 });
  });

  test("a reason is required, and only a difference of the last replay can be accepted", async () => {
    expect((await call("/api/runs/inv/decisions", { ...accept, why: "" })).status).toBe(400);
    expect((await call("/api/runs/inv/decisions", { ...accept, by: "  " })).status).toBe(400);
    expect((await call("/api/runs/inv/decisions", { ...accept, field: "Customer" })).status).toBe(404);
    expect((await call("/api/runs/..%2Fetc/decisions", accept)).status).toBe(400);
  });

  test("the second difference accepted gives parity; revoking one takes it back", async () => {
    const tax = await call("/api/runs/inv/decisions", { ...accept, field: "Tax", kind: "change" });
    expect((await tax.json()).equal).toBe(true);
    const revoke = await call("/api/runs/inv/decisions/revoke", { screen: "frame-4", field: "Tax" });
    expect((await revoke.json()).equal).toBe(false);
    expect((await call("/api/runs/inv/decisions/revoke", { screen: "frame-4", field: "Tax" })).status).toBe(
      404,
    );
  });

  test("Send to Muse Code runs one repair then a new replay, of an app under generated/ only", async () => {
    const r = await call("/api/runs/inv/repair", {});
    expect(r.status).toBe(202);
    await Bun.sleep(20);
    const status = await (await call("/api/runs/inv/repair")).json();
    expect(status.state).toBe("done");
    expect(status.log).toContain("repair 1: $0.000  PARITY");
    expect(started.map((c) => c[2])).toEqual(["rebuild", "report"]);
    expect(started[0]).toEqual(expect.arrayContaining(["--max", "1", "--app", "generated/inv/app"]));

    expect(repairs.commands("inv", { app: "../outside" })).toContain("generated/");
    expect(
      repairs.commands("inv", { app: "generated/inv/app", referenceUrl: "http://example.com/" }),
    ).toContain("on this machine");
    expect(
      repairs.commands("inv", { app: "generated/inv/app", referenceUrl: "file:///etc/passwd" }),
    ).toContain("on this machine");
    expect(repairs.commands("inv", undefined)).toContain("app folder");
  });
});

describe("a run folder from someone else", () => {
  test("history entries that are not what Parity writes are dropped before the page prints them", async () => {
    const { readHistory } = await import("../src/rebuild/history");
    const file = join(dir, "inv", "history.json");
    writeFileSync(
      file,
      JSON.stringify([
        {
          n: 0,
          kind: "repair",
          costUsd: 0,
          equal: false,
          different: "<img src=x onerror=alert(1)>",
          missing: 0,
          at: "2026-10-28T10:00:00.000Z",
          source: "rebuild",
        },
        {
          n: 1,
          kind: "repair",
          costUsd: 0.46,
          equal: true,
          different: 0,
          missing: 0,
          fieldsEqual: 258,
          fieldsCompared: 258,
          at: "2026-10-28T10:05:00.000Z",
          source: "diff screen",
        },
      ]),
    );
    const history = await readHistory(file);
    expect(history).toHaveLength(1);
    expect(history[0]?.source).toBe("diff screen");
  });
});
