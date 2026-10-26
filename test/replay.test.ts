import { afterAll, describe, expect, test } from "bun:test";
import { serveFixture } from "../scripts/fixture-server";
import { loadConfig } from "../src/config";
import { diffScreens } from "../src/diff/diff";
import { detectVolatile } from "../src/diff/volatile";
import { openBrowser } from "../src/drivers";
import { matchScreens } from "../src/fields/match";
import type { Screen } from "../src/fields/types";
import { ProofSchema } from "../src/proof/schema";
import { prove } from "../src/replay/prove";
import { vs3Invoice, webInvoice } from "./fixtures/screens";

const mapping = { "l-customer": "r-billto", "l-amount": "r-linetotal" };

describe("diffScreens", () => {
  const diff = diffScreens(matchScreens(vs3Invoice, webInvoice, { mapping }));

  test("only the total and the balance differ; formatting differences are not differences", () => {
    const different = diff.fields.filter((f) => f.verdict === "different").map((f) => f.legacy.label);
    expect(different.sort()).toEqual(["Balance", "Total"]);
    expect(diff.counts.equal).toBe(12);
  });

  test("dates in two formats and money with and without a symbol compare equal", () => {
    const date = diff.fields.find((f) => f.legacy.label === "Date:");
    expect(date?.verdict).toBe("equal");
    const price = diff.fields.find((f) => f.legacy.label === "Price");
    expect(price?.legacyValue).toBe("1998");
    expect(price?.rebuiltValue).toBe("1998");
  });

  test("a volatile field is shown as masked, not counted as a difference", () => {
    const masked = diffScreens(matchScreens(vs3Invoice, webInvoice, { mapping }), ["Total"]);
    expect(masked.fields.find((f) => f.legacy.label === "Total")?.verdict).toBe("masked");
    expect(masked.counts.different).toBe(1);
  });
});

describe("detectVolatile", () => {
  const screen = (printed: string, total: string): Screen => ({
    id: "s",
    app: "a",
    fields: [
      { id: "p", label: "Printed at", value: printed },
      { id: "t", label: "Total", value: total },
    ],
  });

  test("fields that change between two runs of the same app are noise", () => {
    expect(
      detectVolatile([screen("2026-10-26T10:00:00Z", "1.00")], [screen("2026-10-26T10:00:05Z", "1.00")]),
    ).toEqual(["Printed at"]);
  });

  test("runs of different shapes are an error, not a silent pass", () => {
    expect(() => detectVolatile([screen("a", "1")], [])).toThrow();
  });
});

const proof = ProofSchema.parse(await Bun.file("fixtures/proofs/vs3-invoice.json").json());

describe("prove, end to end in a real browser", () => {
  const servers: { stop: (force?: boolean) => void }[] = [];
  afterAll(() => {
    for (const s of servers) s.stop(true);
  });

  async function run(roundOnce: boolean) {
    const server = serveFixture(roundOnce);
    servers.push(server);
    const driver = await openBrowser(loadConfig({}), { url: `http://127.0.0.1:${server.port}/` });
    try {
      return await prove(proof, driver);
    } finally {
      await driver.close();
    }
  }

  test("the naive rebuild is caught on the cent, with noise masked and no false difference", async () => {
    const result = await run(false);
    expect(result.equal).toBe(false);
    expect(result.volatile).toEqual(["Printed at", "Reference"]);
    const diff = result.checkpoints[0]?.diff;
    const different = diff?.fields.filter((f) => f.verdict === "different").map((f) => f.legacy.label);
    expect(different?.sort()).toEqual(["Balance", "Total"]);
    expect(diff?.counts.missing).toBe(0);
  }, 60_000);

  test("the fixed rebuild proves parity", async () => {
    const result = await run(true);
    expect(result.equal).toBe(true);
    expect(result.checkpoints[0]?.diff.counts.equal).toBe(10);
  }, 60_000);
});
