import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { diffScreens } from "../src/diff/diff";
import { matchScreens } from "../src/fields/match";
import type { Screen } from "../src/fields/types";
import { Ledger } from "../src/models/ledger";
import { ProofSchema } from "../src/proof/schema";
import { RuleStore } from "../src/rules/store";
import { createApp } from "../src/server/app";
import { openDb } from "../src/store/db";

const evil = '<img src=x onerror="alert(1)">';
const screen = (total: string, label = "Total"): Screen => ({
  id: "frame-4",
  app: "a",
  fields: [{ id: "t", label, value: total, box: { x: 0.7, y: 0.9, w: 0.05, h: 0.02 } }],
});
const proof = ProofSchema.parse({
  format: "parity-proof",
  version: 1,
  createdAt: "2026-10-26T00:00:00Z",
  reference: { app: "Virtual Salesman 3", source: "capture" },
  scenarios: [{ id: "sc", name: evil, steps: [{ do: "check", screen: "frame-4" }] }],
  checkpoints: [{ scenario: "sc", step: 0, screen: screen("69.21") }],
});
const diff = diffScreens(matchScreens(screen("69.21"), screen("69.22")));

const dir = mkdtempSync(join(tmpdir(), "parity-screens-"));
mkdirSync(join(dir, "inv", "evidence"), { recursive: true });
writeFileSync(join(dir, "inv", "proof.json"), JSON.stringify(proof));
writeFileSync(
  join(dir, "inv", "result.json"),
  JSON.stringify({
    result: {
      volatile: [],
      equal: false,
      checkpoints: [{ scenario: "sc", step: 0, screen: "frame-4", diff }],
    },
    candidate: "generated/inv/app",
    at: "2026-10-26T12:00:00Z",
    evidence: { "sc:0": "sc-0.png" },
  }),
);
writeFileSync(join(dir, "inv", "evidence", "sc-0.png"), "png");
const db = openDb(":memory:");
const app = createApp(new Ledger(db), {
  token: "t-0123456789abcdef",
  launchKey: "k-0123456789abcdef",
  port: 8787,
  rules: new RuleStore(db),
  runsDir: dir,
});
const host = { host: "127.0.0.1:8787" };
const get = (path: string, headers: Record<string, string> = {}) =>
  app.request(`http://127.0.0.1:8787${path}`, { headers: { ...host, ...headers } });
let cookie = "";

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("app screens", () => {
  test("the brand fonts are served from this server, and nothing else is", async () => {
    const ok = await get("/assets/fonts/Geist-Variable.woff2");
    expect(ok.status).toBe(200);
    expect(ok.headers.get("content-type")).toBe("font/woff2");
    expect((await get("/assets/fonts/OFL.txt")).status).toBe(404);
    expect((await get("/assets/fonts/..%2F..%2Fapp.ts")).status).toBe(404);
  });

  test("the diff screen needs the session opened by the one-time link", async () => {
    expect((await get("/diff/inv")).status).toBe(401);
    const open = await get("/open?k=k-0123456789abcdef");
    cookie = (open.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
    expect(cookie).toContain("parity_session=");
    const page = await get("/diff/inv", { cookie });
    expect(page.status).toBe(200);
    const html = await page.text();
    expect(html).toContain("No parity · 1 difference");
    expect(html).toContain("69.22");
  });

  test("text from the apps and the proof is escaped on the diff screen", async () => {
    const html = await (await get("/diff/inv", { cookie })).text();
    expect(html).not.toContain(evil);
    expect(html).toContain("&#60;img src=x");
  });

  test("the page loads nothing from another origin", async () => {
    const html = await (await get("/diff/inv", { cookie })).text();
    expect(html).not.toMatch(/(src|href)=["']https?:\/\//);
    expect(html).not.toContain("@import");
  });

  test("evidence images are served by exact name only", async () => {
    const auth = { authorization: "Bearer t-0123456789abcdef" };
    expect((await get("/api/runs/inv/evidence/sc-0.png", auth)).status).toBe(200);
    expect((await get("/api/runs/inv/evidence/..%2Fproof.json", auth)).status).toBe(400);
    expect((await get("/api/runs/inv/evidence/proof.json", auth)).status).toBe(400);
    expect((await get("/api/runs/inv/evidence/missing.png", auth)).status).toBe(404);
    expect((await get("/api/runs/inv/evidence/sc-0.png")).status).toBe(401);
  });

  test("a run with no replay yet says how to make one", async () => {
    rmSync(join(dir, "inv", "result.json"));
    const html = await (await get("/diff/inv", { cookie })).text();
    expect(html).toContain("No replay for this run yet");
  });
});
