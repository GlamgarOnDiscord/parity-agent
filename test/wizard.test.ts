import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { Inventory } from "../src/migrate/inventory";
import { MigrationSchema } from "../src/migrate/migrate";
import { Ledger } from "../src/models/ledger";
import { RuleStore } from "../src/rules/store";
import { createApp } from "../src/server/app";
import { draft, MigrateJobs, withScreens } from "../src/server/wizard";
import { openDb } from "../src/store/db";

const inventory: Inventory = {
  origin: "http://127.0.0.1:8080",
  at: "2026-11-04T08:00:00.000Z",
  skipped: [],
  screens: [
    { path: "/", title: "Main Menu", labels: [], selectors: [], links: ["/customers", "/prices"] },
    {
      path: "/customers",
      title: "Customers",
      labels: ["Customer Name", "Credit Limit"],
      selectors: [{ field: "Select a customer:", choices: 2 }],
      links: [],
      menu: "Main Menu",
    },
    {
      path: "/prices",
      title: "Legacy",
      name: "Item prices",
      labels: ["Price"],
      selectors: [{ field: "stock_id", choices: 6 }],
      links: [],
      menu: "Main Menu",
    },
  ],
};

describe("the migration a person builds on the page", () => {
  test("a login becomes the setup steps, and no screen is picked yet", () => {
    const m = draft({
      name: "crm",
      title: "Our CRM",
      url: "http://127.0.0.1:8080/",
      login: {
        userField: "User name",
        user: "demo",
        passwordField: "Password",
        password: "demo",
        button: "Login",
      },
    });
    expect(m.setup).toEqual([
      { do: "open", path: "/" },
      { do: "fill", field: "User name", value: "demo" },
      { do: "fill", field: "Password", value: "demo" },
      { do: "click", target: "Login" },
    ]);
    expect(m.screens).toEqual([]);
  });

  test("each picked screen is an entity read through its list, or by address when the list has no label", () => {
    const m = withScreens(draft({ name: "crm", title: "CRM", url: "http://127.0.0.1:8080/" }), inventory, [
      { path: "/customers", selector: "Select a customer:" },
      { path: "/prices", selector: "stock_id" },
    ]);
    expect(m.entities).toEqual([
      { id: "customers", path: "/customers", selector: "Select a customer:" },
      { id: "item-prices", path: "/prices", selector: "stock_id", param: "stock_id" },
    ]);
    expect(m.screens.map((s) => [s.id, s.entity, s.title])).toEqual([
      ["customers", "customers", "Customers"],
      ["item-prices", "item-prices", "Item prices"],
    ]);
    expect(() => withScreens(m, inventory, [{ path: "/customers", selector: "Payment terms" }])).toThrow(
      'has no list "Payment terms"',
    );
  });
});

describe("the Rebuild an app routes", () => {
  const dir = mkdtempSync(join(tmpdir(), "parity-wizard-"));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));
  const started: string[][] = [];
  const jobs = new MigrateJobs(resolve(import.meta.dir, ".."), dir, (cmd) => {
    started.push(cmd);
    return {
      lines: (async function* () {
        yield "done";
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
    migrations: jobs,
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

  test("step 1 writes the migration file and crawls; a bad address or name is refused", async () => {
    expect(
      (await call("/api/new", { name: "Bad Name", title: "x", url: "http://127.0.0.1:8080/" })).status,
    ).toBe(400);
    expect((await call("/api/new", { name: "crm", title: "x", url: "file:///etc/passwd" })).status).toBe(400);
    const r = await call("/api/new", { name: "crm", title: "Our CRM", url: "http://127.0.0.1:8080/" });
    expect(r.status).toBe(202);
    await Bun.sleep(20);
    expect(started[0]?.slice(2)).toEqual([
      "migrate",
      "inventory",
      expect.stringMatching(/crm\/migration\.json$/),
    ]);
    const m = MigrationSchema.parse(JSON.parse(readFileSync(join(dir, "crm", "migration.json"), "utf8")));
    expect(m.title).toBe("Our CRM");
    // It holds the old app's login: owner only, where the system has file modes.
    if (process.platform !== "win32")
      expect(statSync(join(dir, "crm", "migration.json")).mode & 0o077).toBe(0);
    expect((await (await call("/api/new/crm")).json()).job.state).toBe("done");
  });

  test("step 2 needs the inventory, then prices the picked screens", async () => {
    expect(
      (
        await call("/api/new/crm/screens", {
          picks: [{ path: "/customers", selector: "Select a customer:" }],
        })
      ).status,
    ).toBe(409);
    mkdirSync(join(dir, "crm"), { recursive: true });
    writeFileSync(join(dir, "crm", "inventory.json"), JSON.stringify(inventory));
    const r = await call("/api/new/crm/screens", {
      picks: [{ path: "/customers", selector: "Select a customer:" }],
    });
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ screens: 1, upTo: 1.9 });
  });

  test("step 3 runs only with a budget, and passes it to the capped command", async () => {
    expect((await call("/api/new/crm/run", {})).status).toBe(409);
    expect((await call("/api/new/crm/prepare", {})).status).toBe(202);
    await Bun.sleep(20);
    const r = await call("/api/new/crm/run", { budget: 3 });
    expect(r.status).toBe(202);
    await Bun.sleep(20);
    expect(started.at(-1)?.slice(2)).toEqual([
      "migrate",
      "run",
      expect.stringMatching(/crm\/migration\.json$/),
      "--budget",
      "3.00",
      "--yes",
    ]);
  });
});
