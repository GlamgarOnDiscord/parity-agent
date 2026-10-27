import { afterAll, beforeAll, describe, expect, setDefaultTimeout, test } from "bun:test";
import { loadConfig } from "../src/config";
import { detectVolatile } from "../src/diff/volatile";
import { openBrowser } from "../src/drivers";
import type { AppDriver } from "../src/drivers/types";
import type { Screen } from "../src/fields/types";

// Chrome starts cold on CI runners; hooks that launch it need more than the default 5 s.
setDefaultTimeout(60_000);

// The shape of a 2000s PHP business form: labels in table cells, a line grid with a header row, totals below.
const PAGE = `<!doctype html><html><head><title>Invoice</title></head><body>
<form><table>
  <tr><td class="label">Customer:</td><td><select name="customer_id"><option value="1">Donald Easter</option>
    <option value="2">MoneyMaker</option></select></td></tr>
  <tr><td class="label">Reference:</td><td><input name="ref" value="002/2022"></td></tr>
</table>
<table>
  <tr><td class="tableheader">Item Code</td><td class="tableheader">Quantity</td><td class="tableheader">Unit</td>
    <td class="tableheader">Price</td><td class="tableheader">Total</td><td class="tableheader"></td></tr>
  <tr><td>101</td><td>3</td><td>each</td><td>300.00</td><td>900.00</td><td><a href="#">Edit</a></td></tr>
  <tr><td><input name="_stock_id_edit"></td><td><input name="qty" value="1"></td><td>each</td>
    <td><input name="price" value="250.00"></td><td>250.00</td><td colspan="2"><button type="button">Add Item</button></td></tr>
  <tr><td colspan="4" align="right">Shipping Charge</td><td><input name="freight_cost" value="0.00"></td></tr>
  <tr><td colspan="4" align="right">Sub-total</td><td>900.00</td></tr>
  <tr><td colspan="4" align="right">Included Tax (5%) 42.86</td><td align="right"></td><td colspan="2"></td></tr>
</table>
<table><tr><td colspan="2">FrontAccounting 2.4.20</td></tr></table>
<table><tr><td>User name</td><td><input name="user_name_entry_field"></td></tr></table>
</form></body></html>`;

let server: ReturnType<typeof Bun.serve>;
let driver: AppDriver;
let screen: Screen;
const value = (label: string, group?: string) =>
  screen.fields.find((f) => f.label === label && f.group === group)?.value;

beforeAll(async () => {
  server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch: () => new Response(PAGE, { headers: { "content-type": "text/html" } }),
  });
  driver = await openBrowser(loadConfig(), { url: `http://127.0.0.1:${server.port}/` });
  await driver.perform({ do: "open", path: "/" });
  screen = await driver.readScreen("s");
});

afterAll(async () => {
  await driver.close();
  server.stop(true);
});

describe("reading old table layouts", () => {
  test("a td.label cell labels the control next to it", () => {
    expect(value("Customer:")).toBe("Donald Easter");
    expect(value("Reference:")).toBe("002/2022");
  });

  test("grid cells take their column header and a row group", () => {
    expect(value("Item Code", "row-1")).toBe("101");
    expect(value("Total", "row-1")).toBe("900.00");
  });

  test("controls in a grid row take the column header, not the text cell before them", () => {
    expect(value("Price", "entry")).toBe("250.00");
    expect(screen.fields.some((f) => f.label === "each" || f.label === "Edit")).toBe(false);
  });

  test("a totals row under the grid labels its value with its own text", () => {
    expect(value("Sub-total")).toBe("900.00");
    expect(value("Shipping Charge")).toBe("0.00");
  });

  test("a totals line with its amount inside the label cell is split into label and value", () => {
    expect(value("Included Tax (5%)")).toBe("42.86");
    expect(screen.fields.some((f) => f.label.startsWith("FrontAccounting"))).toBe(false);
  });

  test("a plain text cell before a control labels it", () => {
    expect(value("User name")).toBe("");
  });

  test("buttons are not fields", () => {
    expect(screen.fields.some((f) => f.value === "Add Item")).toBe(false);
  });

  test("fill finds controls by these labels and picks select options by text", async () => {
    await driver.perform({ do: "fill", field: "Customer", value: "MoneyMaker" });
    await driver.perform({ do: "fill", field: "Quantity", value: "4" });
    const after = await driver.readScreen("s2");
    expect(after.fields.find((f) => f.label === "Customer:")?.value).toBe("MoneyMaker");
    expect(after.fields.find((f) => f.label === "Quantity" && f.group === "entry")?.value).toBe("4");
  });
});

describe("noise across grid rows", () => {
  const s = (rows: [string, string][]): Screen => ({
    id: "s",
    app: "a",
    fields: rows.map(([group, v], i) => ({ id: `f${i}`, label: "Total", value: v, group })),
  });

  test("a repeated label is compared row by row, so stable rows are not noise", () => {
    expect(
      detectVolatile(
        [
          s([
            ["row-1", "810.00"],
            ["row-2", "100.00"],
          ]),
        ],
        [
          s([
            ["row-1", "810.00"],
            ["row-2", "100.00"],
          ]),
        ],
      ),
    ).toEqual([]);
  });

  test("a value that really changes in one row is still noise", () => {
    expect(
      detectVolatile(
        [
          s([
            ["row-1", "810.00"],
            ["row-2", "100.00"],
          ]),
        ],
        [
          s([
            ["row-1", "810.00"],
            ["row-2", "101.00"],
          ]),
        ],
      ),
    ).toEqual(["Total @ row-2"]);
  });
});
