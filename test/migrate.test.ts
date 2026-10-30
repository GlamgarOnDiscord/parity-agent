import { afterAll, beforeAll, describe, expect, setDefaultTimeout, test } from "bun:test";
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig } from "../src/config";
import { openBrowser } from "../src/drivers";
import type { AppDriver } from "../src/drivers/types";
import { crawl, UNSAFE } from "../src/migrate/inventory";
import { estimate, MigrationSchema, roles, scaffold } from "../src/migrate/migrate";
import { isInternal, pickSteps, readRecords, recordScenarios } from "../src/migrate/records";
import { ProofSchema } from "../src/proof/schema";
import { proveApp } from "../src/rebuild/rebuild";
import { BoardSchema, boardPage } from "../src/server/board";

setDefaultTimeout(90_000);

// A tiny legacy app: a menu, a customer form picked from a list, a price form picked by address, a delete link.
const CUSTOMERS: Record<string, { name: string; limit: string; active: boolean }> = {
  "1": { name: "Donald Easter LLC", limit: "1,000.00", active: true },
  "2": { name: "MoneyMaker Ltd.", limit: "25,000.00", active: false },
};
const PRICES: Record<string, string> = { "101": "300.00", "102": "250.00" };
const page = (body: string) =>
  new Response(`<!doctype html><title>Legacy</title>${body}`, { headers: { "content-type": "text/html" } });
const legacy = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/")
      return page(
        `<a href="/customers">Customers</a> <a href="/prices">Prices</a> <a href="/customers?delete=1">Delete customer</a>`,
      );
    if (url.pathname === "/customers") {
      const c = CUSTOMERS[url.searchParams.get("id") ?? ""];
      return page(`<form><label for="pick">Select a customer:</label> <select id="pick" name="id" onchange="this.form.submit()">
        <option value="">New customer</option>${Object.entries(CUSTOMERS)
          .map(
            ([id, x]) =>
              `<option value="${id}"${c === x ? " selected" : ""}>${x.name.split(" ")[0]}</option>`,
          )
          .join("")}</select></form>
        <label>Customer Name: <input value="${c?.name ?? ""}"></label>
        <label>Credit Limit: <input value="${c?.limit ?? "1,000.00"}"></label>
        <label>Active: <input type="checkbox"${c?.active ? " checked" : ""}></label>
        <input name="customer_id" value="${url.searchParams.get("id") ?? ""}" aria-label="customer_id">
        <a href="/">Main menu</a>`);
    }
    if (url.pathname === "/prices") {
      const code = url.searchParams.get("stock_id") ?? "101";
      return page(`<label for="item">Item:</label> <select id="item"><option value="101"${code === "101" ? " selected" : ""}>iPad</option>
        <option value="102"${code === "102" ? " selected" : ""}>iPhone</option></select>
        <label>Price: <input value="${PRICES[code]}"></label>`);
    }
    return new Response("no", { status: 404 });
  },
});
const setup = [{ do: "open" as const, path: "/" }];
let driver: AppDriver;
const dir = mkdtempSync(join(tmpdir(), "parity-migrate-"));

beforeAll(async () => {
  driver = await openBrowser(loadConfig(), { url: `http://127.0.0.1:${legacy.port}/` });
});
afterAll(async () => {
  await driver?.close();
  legacy.stop(true);
  rmSync(dir, { recursive: true, force: true });
});

describe("inventory", () => {
  test("follows links breadth first, reads each screen, finds record lists, never follows an unsafe link", async () => {
    const inv = await crawl(driver, { setup, start: ["/"], minChoices: 2 });
    expect(inv.screens.map((s) => s.path)).toEqual(["/", "/customers", "/prices"]);
    const customers = inv.screens.find((s) => s.path === "/customers");
    expect(customers?.labels).toContain("Customer Name");
    expect(customers?.selectors).toEqual([{ field: "Select a customer:", choices: 2 }]);
    expect(inv.skipped).toEqual(["/customers?delete=1"]);
    expect(UNSAFE.test("/sales/manage/customers.php")).toBe(false);
  });
});

describe("records through the legacy screens", () => {
  test("picks every choice of the list, skips the placeholder and drops form plumbing", async () => {
    const e = await readRecords(driver, {
      id: "customers",
      path: "/customers",
      selector: "Select a customer:",
      setup,
    });
    expect(e.records.map((r) => r.key)).toEqual(["Donald", "MoneyMaker"]);
    const second = e.records[1]?.values.map((f) => [f.label, f.value]);
    expect(second).toContainEqual(["Customer Name:", "MoneyMaker Ltd."]);
    expect(second).toContainEqual(["Credit Limit:", "25,000.00"]);
    expect(second).toContainEqual(["Active:", "false"]);
    expect(e.fields).not.toContain("customer_id");
    expect(isInternal("_stock_id_edit")).toBe(true);
    expect(isInternal("Customer Name:")).toBe(false);
  });

  test("a form that ignores the pick is refused, and the same form picked by address works", async () => {
    await expect(
      readRecords(driver, { id: "prices", path: "/prices", selector: "Item:", setup }),
    ).rejects.toThrow("does not change the form");
    // A list known only by its form name has no label a rebuild could show.
    await expect(
      readRecords(driver, { id: "prices", path: "/prices", selector: "stock_id", setup }),
    ).rejects.toThrow("no visible label");
    const e = await readRecords(driver, {
      id: "prices",
      path: "/prices",
      selector: "Item:",
      param: "stock_id",
      setup,
    });
    expect(e.records.map((r) => [r.key, r.values.find((f) => f.label === "Price:")?.value])).toEqual([
      ["iPad", "300.00"],
      ["iPhone", "250.00"],
    ]);
    expect(pickSteps(e, { text: "iPhone", value: "102" })).toEqual([
      { do: "open", path: "/prices?stock_id=102" },
    ]);
  });

  test("each record is a scenario of the proof; a screen of the template that reads the data proves it", async () => {
    const e = await readRecords(driver, {
      id: "customers",
      path: "/customers",
      selector: "Select a customer:",
      setup,
    });
    const { scenarios, checkpoints } = recordScenarios(e, "Legacy");
    expect(scenarios[0]?.steps).toEqual([
      { do: "open", path: "/customers" },
      { do: "fill", field: "Select a customer:", value: "Donald" },
      { do: "check", screen: scenarios[0]?.id as string, note: "customers record Donald" },
    ]);
    const proof = ProofSchema.parse({
      format: "parity-proof",
      version: 1,
      createdAt: "2026-10-30T00:00:00Z",
      reference: { app: "Legacy", source: "replay" },
      scenarios,
      checkpoints,
    });

    const m = MigrationSchema.parse({
      name: "legacy",
      title: "Legacy",
      url: `http://127.0.0.1:${legacy.port}/`,
      start: ["/"],
      entities: [{ id: "customers", path: "/customers", selector: "Select a customer:" }],
      screens: [{ id: "customers", title: "Customers", entity: "customers" }],
    });
    const app = join(dir, "app");
    scaffold(app, m, [e]);
    // What a build writes: the record from the migrated data, never from code.
    writeFileSync(
      join(app, "public", "screens", "customers.js"),
      `export async function render(root, kit) {
  const records = await kit.data("customers");
  const draw = (key) => {
    root.replaceChildren(kit.ui.picker("Select a customer:", records.map((r) => r.key), key, draw));
    const r = records.find((x) => x.key === key);
    if (r) root.append(kit.ui.card("Customer", kit.ui.grid(...r.fields.map((f) =>
      kit.ui.field(f.label, f.value, { kind: f.value === "true" || f.value === "false" ? "checkbox" : undefined })))).el);
  };
  draw("");
}`,
    );
    const result = await proveApp(loadConfig(), app, proof);
    expect(result.equal).toBe(true);

    // The same screen with a value written in code is caught.
    writeFileSync(
      join(app, "data", "customers.json"),
      JSON.stringify({
        entity: "customers",
        records: e.records.map((r) => ({
          ...r,
          fields: r.values.map((f) => (f.label === "Credit Limit:" ? { ...f, value: "9.99" } : f)),
        })),
      }),
    );
    expect((await proveApp(loadConfig(), app, proof)).equal).toBe(false);
  });
});

describe("a workspace Muse Code has edited", () => {
  const m = MigrationSchema.parse({
    name: "safe",
    title: "Safe",
    url: "http://127.0.0.1:8080/",
    start: ["/"],
    entities: [],
    screens: [{ id: "a", title: "A", path: "/a", proof: "x.json" }],
  });

  test("a link put in place of a fixed file is replaced, never written through", () => {
    const app = join(dir, "linked");
    scaffold(app, m, []);
    const outside = join(dir, "outside.txt");
    writeFileSync(outside, "keep me");
    rmSync(join(app, "public", "app.js"));
    try {
      symlinkSync(outside, join(app, "public", "app.js"), "file");
    } catch {
      return; // creating file links needs a privilege this machine may not grant
    }
    scaffold(app, m, []);
    expect(readFileSync(outside, "utf8")).toBe("keep me");
    expect(lstatSync(join(app, "public", "app.js")).isSymbolicLink()).toBe(false);
  });

  test("a folder of the app replaced by a link to elsewhere is refused", () => {
    const app = join(dir, "junction");
    scaffold(app, m, []);
    const elsewhere = join(dir, "elsewhere");
    mkdirSync(elsewhere);
    rmSync(join(app, "data"), { recursive: true, force: true });
    symlinkSync(elsewhere, join(app, "data"), "junction");
    expect(() =>
      scaffold(app, m, [{ id: "items", path: "/i", selector: "Item:", fields: [], records: [] }]),
    ).toThrow("not a real directory");
  });
});

describe("plan and board", () => {
  const m = MigrationSchema.parse({
    name: "fa",
    title: "FA",
    url: "http://127.0.0.1:8080/",
    start: ["/"],
    entities: [],
    screens: [
      { id: "a", title: "A", path: "/a", proof: "x.json" },
      { id: "b", title: "B", path: "/b", proof: "x.json" },
    ],
    maxRepairs: 2,
  });

  test("the estimate is printed per screen before anything is spent, and says which model does what", () => {
    const e = estimate(m);
    expect(e.rows).toHaveLength(2);
    expect(e.upTo).toBeCloseTo(2 * (1 + 2 * 0.45));
    expect(roles(m, false).find((r) => r.model.startsWith("Muse Code"))?.used).toBe(true);
    expect(roles(m, false).find((r) => r.model.includes("computer use"))?.used).toBe(false);
  });

  test("the board shows screens and spend, and refuses a board that is not what Parity writes", () => {
    const board = BoardSchema.parse({
      name: "fa",
      title: "FrontAccounting",
      at: "2026-10-30T12:00:00.000Z",
      budgetUsd: 6,
      spentUsd: 1.5,
      entities: [{ id: "customers", path: "/c", records: 2, fields: 14 }],
      screens: [
        {
          screen: "customers",
          title: "Customers",
          state: "proved",
          scenarios: 2,
          fieldsEqual: 28,
          fieldsCompared: 28,
          costUsd: 0.8,
        },
        { screen: "invoice", title: "<b>Invoice</b>", state: "skipped", scenarios: 7 },
      ],
    });
    const html = boardPage(board);
    expect(html).toContain("1 / 2<small>proved</small>");
    expect(html).toContain("$1.50<small>of $6.00</small>");
    expect(html).toContain("&#60;b&#62;Invoice");
    expect(
      BoardSchema.safeParse({ ...board, screens: [{ ...board.screens[0], scenarios: "two" }] }).success,
    ).toBe(false);
  });
});
