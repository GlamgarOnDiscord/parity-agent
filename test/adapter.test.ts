import { afterAll, beforeAll, describe, expect, setDefaultTimeout, test } from "bun:test";
import { loadConfig } from "../src/config";
import { openBrowser } from "../src/drivers";
import type { AppDriver } from "../src/drivers/types";
import { matchScreens } from "../src/fields/match";
import type { Screen } from "../src/fields/types";
import { AdapterSchema, ScenarioSchema } from "../src/proof/schema";
import { replay } from "../src/replay/replay";

// Chrome starts cold on CI runners; hooks that launch it need more than the default 5 s.
setDefaultTimeout(60_000);

// A legacy app that needs a login before its invoice page, which lives at its own path.
const PAGES: Record<string, string> = {
  "/": `<form><label>User name <input name="u"></label><button type="button" onclick="document.cookie='s=1;path=/';location.href='/home'">Login</button></form>`,
  "/home": `<p>Welcome</p>`,
  "/sales/invoice.php": `<script>if (!document.cookie.includes("s=1")) location.href = "/";</script><label>Total <output data-field="Total">69.21</output></label>`,
};

let server: ReturnType<typeof Bun.serve>;
let driver: AppDriver;

beforeAll(async () => {
  server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch: (req) => {
      const html = PAGES[new URL(req.url).pathname];
      return html
        ? new Response(`<!doctype html><title>t</title>${html}`, { headers: { "content-type": "text/html" } })
        : new Response("no", { status: 404 });
    },
  });
  driver = await openBrowser(loadConfig(), { url: `http://127.0.0.1:${server.port}/` });
});

afterAll(async () => {
  await driver.close();
  server.stop(true);
});

describe("reference adapter", () => {
  const scenario = ScenarioSchema.parse({
    id: "inv",
    name: "invoice",
    steps: [
      { do: "open", path: "/" },
      { do: "check", screen: "invoice" },
    ],
  });

  test("the prelude logs in and the scenario's path is mapped to the app's own", async () => {
    const adapter = AdapterSchema.parse({
      prelude: [
        { do: "open", path: "/" },
        { do: "fill", field: "User name", value: "admin" },
        { do: "click", target: "Login" },
      ],
      paths: { "/": "/sales/invoice.php" },
    });
    const [checkpoint] = await replay(driver, scenario, undefined, adapter);
    expect(checkpoint?.screen.fields.find((f) => f.label === "Total")?.value).toBe("69.21");
  });

  test("without the adapter the same scenario stays on the login page", async () => {
    const [checkpoint] = await replay(driver, scenario);
    expect(checkpoint?.screen.fields.some((f) => f.label === "Total")).toBe(false);
  });

  test("a prelude cannot hide a check step", () => {
    expect(() => AdapterSchema.parse({ prelude: [{ do: "check", screen: "x" }] })).toThrow();
  });
});

describe("repeated labels in grid rows", () => {
  const row = (group: string, value: string, y: number) => ({
    id: `${group}-total`,
    label: "Total",
    value,
    group,
    box: { x: 0.5, y, w: 0.1, h: 0.02 },
  });
  test("both apps naming rows pair Total with Total of the same row, whatever the layout", () => {
    // The rebuilt app lists its entry row first; positions alone would pair the wrong rows.
    const legacy: Screen = {
      id: "s",
      app: "a",
      fields: [row("row-1", "810.00", 0.3), row("row-2", "100.00", 0.35), row("entry", "250.00", 0.4)],
    };
    const rebuilt: Screen = {
      id: "s",
      app: "b",
      fields: [row("entry", "250.00", 0.3), row("row-1", "810.00", 0.35), row("row-2", "100.00", 0.4)],
    };
    const m = matchScreens(legacy, rebuilt);
    for (const pair of m.matches) expect(pair.legacy.group).toBe(pair.rebuilt.group);
    expect(m.matches).toHaveLength(3);
  });
});
