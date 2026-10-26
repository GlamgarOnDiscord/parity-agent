import { describe, expect, test } from "bun:test";
import { loadConfig } from "../src/config";
import { Ledger } from "../src/models/ledger";
import { costOf } from "../src/models/pricing";
import { openDb } from "../src/store/db";

describe("pricing", () => {
  test("token, image and audio prices", () => {
    expect(costOf("muse-spark-1.3", { inputTokens: 1_000_000, outputTokens: 1_000_000 }).usd).toBeCloseTo(
      5.5,
    );
    expect(costOf("sam-3.1", { images: 31 }).usd).toBeCloseTo(0.0775);
    expect(costOf("muse-voice-transcribe-1.0", { audioSeconds: 3600 }).usd).toBeCloseTo(0.18);
    expect(costOf("meta-models/muse-spark-open-1026", { inputTokens: 1000 })).toEqual({
      usd: 0,
      known: false,
    });
  });
});

describe("ledger", () => {
  test("records every call with its cost and bytes sent", () => {
    const ledger = new Ledger(openDb(":memory:"));
    ledger.record({
      runId: "r1",
      role: "structured",
      provider: "meta",
      model: "muse-spark-1.3",
      usage: { inputTokens: 10_000, outputTokens: 1_000 },
      sentBytes: 4096,
      durationMs: 900,
      ok: true,
    });
    ledger.record({
      runId: "r1",
      role: "segment",
      provider: "meta",
      model: "sam-3.1",
      usage: { images: 2 },
      sentBytes: 200_000,
      durationMs: 1200,
      ok: false,
      error: "429",
    });
    const total = ledger.total("r1");
    expect(total.calls).toBe(2);
    expect(total.costUsd).toBeCloseTo(0.0125 + 0.00425 + 0.005);
    expect(total.sentBytes).toBe(204_096);
    expect(ledger.list("r1")).toHaveLength(2);
    expect(ledger.total("other").calls).toBe(0);
  });
});

describe("config", () => {
  test("defaults are the Standard-tier models and a local server", () => {
    const c = loadConfig({});
    expect(c.PARITY_MODEL_STRUCTURED).toBe("muse-spark-1.3");
    expect(c.PARITY_BROWSER).toBe("chromium");
    expect(c.PARITY_PORT).toBe(8787);
  });

  test("a Contributor model is refused", () => {
    expect(() => loadConfig({ PARITY_MODEL_STRUCTURED: "muse-spark-1.3-contributor" })).toThrow(
      /Standard tier/,
    );
  });
});
