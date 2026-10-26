import { describe, expect, test } from "bun:test";
import { MAX_PAIRS, matchScreens } from "../src/fields/match";
import { inferKind } from "../src/fields/normalize";
import type { Screen } from "../src/fields/types";
import { Ledger, redact } from "../src/models/ledger";
import { RuleStore } from "../src/rules/store";
import { createApp } from "../src/server/app";
import { openDb } from "../src/store/db";
import { vs3Invoice, webInvoice } from "./fixtures/screens";

const token = "test-token-0123456789";
const memDb = openDb(":memory:");
const app = createApp(new Ledger(memDb), { token, port: 8787, rules: new RuleStore(memDb), runsDir: "runs" });
const base = "http://127.0.0.1:8787";
const auth = { authorization: `Bearer ${token}` };

describe("local API", () => {
  test("a foreign Host header is refused (DNS rebinding)", async () => {
    const res = await app.request(`${base}/api/calls`, { headers: { ...auth, host: "evil.example:8787" } });
    expect(res.status).toBe(403);
  });

  test("a cross-site Origin is refused", async () => {
    const res = await app.request(`${base}/api/calls`, {
      headers: { ...auth, host: "127.0.0.1:8787", origin: "https://evil.example" },
    });
    expect(res.status).toBe(403);
  });

  test("the API needs the launch token", async () => {
    const res = await app.request(`${base}/api/calls`, { headers: { host: "127.0.0.1:8787" } });
    expect(res.status).toBe(401);
    const ok = await app.request(`${base}/api/calls`, { headers: { ...auth, host: "127.0.0.1:8787" } });
    expect(ok.status).toBe(200);
  });

  test("POST needs JSON, which blocks simple cross-site form posts", async () => {
    const res = await app.request(`${base}/api/match`, {
      method: "POST",
      headers: { ...auth, host: "127.0.0.1:8787", "content-type": "text/plain" },
      body: "{}",
    });
    expect(res.status).toBe(415);
  });

  test("a valid match request still works", async () => {
    const res = await app.request(`${base}/api/match`, {
      method: "POST",
      headers: { ...auth, host: "127.0.0.1:8787", "content-type": "application/json" },
      body: JSON.stringify({ legacy: vs3Invoice, rebuilt: webInvoice }),
    });
    expect(res.status).toBe(200);
  });

  test("oversized labels are rejected before any work", async () => {
    const big = { ...vs3Invoice, fields: [{ id: "x", label: "a".repeat(300), value: "1" }] };
    const res = await app.request(`${base}/api/match`, {
      method: "POST",
      headers: { ...auth, host: "127.0.0.1:8787", "content-type": "application/json" },
      body: JSON.stringify({ legacy: big, rebuilt: webInvoice }),
    });
    expect(res.status).toBe(400);
  });
});

describe("resource limits", () => {
  test("adversarial money strings stay fast", () => {
    const start = performance.now();
    for (let i = 0; i < 200; i++) inferKind(`$${" ".repeat(30)}${"1,000".repeat(12)}x`);
    expect(performance.now() - start).toBeLessThan(200);
  });

  test("screens too large to score are refused", () => {
    const n = Math.ceil(Math.sqrt(MAX_PAIRS)) + 1;
    const screen = (prefix: string): Screen => ({
      id: prefix,
      app: "x",
      fields: Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}`, label: `f${i}`, value: "1" })),
    });
    expect(() => matchScreens(screen("a"), screen("b"))).toThrow(/too many/);
  });
});

describe("redact", () => {
  test("keys and bearer tokens never reach the ledger", () => {
    const text = redact(
      "401 from api: Authorization: Bearer abc.def-123456789 api_key=sk-live-0123456789abcdef",
    );
    expect(text).not.toContain("abc.def-123456789");
    expect(text).not.toContain("0123456789abcdef");
    expect(redact("x".repeat(5000)).length).toBe(500);
  });
});

describe("proof steps", () => {
  test("an open step can only target a path on the app under test", async () => {
    const { StepSchema } = await import("../src/proof/schema");
    const ok = (path: string) => StepSchema.safeParse({ do: "open", path }).success;
    expect(ok("/")).toBe(true);
    expect(ok("/invoices/101?x=1")).toBe(true);
    expect(ok("file:///C:/Windows/win.ini")).toBe(false);
    expect(ok("http://169.254.169.254/latest/meta-data")).toBe(false);
    expect(ok("//evil.example/")).toBe(false);
    expect(ok("/\\evil.example")).toBe(false);
    expect(ok("/evil.example")).toBe(true);
    expect(ok("javascript:alert(1)")).toBe(false);
  });
});

describe("browser session", () => {
  const db = openDb(":memory:");
  const key = "launch-key-0123456789";
  const local = createApp(new Ledger(db), {
    token,
    launchKey: key,
    port: 8787,
    rules: new RuleStore(db),
    runsDir: "runs",
  });
  const h = { host: "127.0.0.1:8787" };

  test("the review page needs a session and never contains the API token", async () => {
    expect((await local.request(`${base}/review/x`, { headers: h })).status).toBe(401);
    expect((await local.request(`${base}/open?k=wrong`, { headers: h })).status).toBe(403);
    const opened = await local.request(`${base}/open?k=${key}&run=x`, { headers: h });
    expect(opened.status).toBe(302);
    const cookie = opened.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    const session = cookie.split(";")[0] ?? "";
    const page = await local.request(`${base}/review/x`, { headers: { ...h, cookie: session } });
    expect(page.status).toBe(200);
    expect(await page.text()).not.toContain(token);
    const api = await local.request(`${base}/api/runs`, { headers: { ...h, cookie: session } });
    expect(api.status).toBe(200);
  });

  test("the launch key works once", async () => {
    expect((await local.request(`${base}/open?k=${key}`, { headers: h })).status).toBe(403);
  });
});
