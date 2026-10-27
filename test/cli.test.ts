import { afterAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { diffScreens } from "../src/diff/diff";
import { matchScreens } from "../src/fields/match";
import type { Screen } from "../src/fields/types";
import { summaryOf } from "../src/report/summary";

const root = join(import.meta.dir, "..");
const run = (args: string[]) =>
  Bun.spawnSync([process.execPath, ...args], { cwd: root, stdout: "pipe", stderr: "pipe" });

const screen = (total: string, label = "Total"): Screen => ({
  id: "s",
  app: "a",
  fields: [{ id: "t", label, value: total }],
});
const result = (a: Screen, b: Screen) => {
  const diff = diffScreens(matchScreens(a, b));
  return {
    volatile: [],
    equal: diff.counts.different === 0,
    checkpoints: [{ scenario: "sc", step: 6, screen: "s", diff }],
  };
};

describe("parity command", () => {
  test("help lists every command and says which ones call models", () => {
    const out = run(["bin/parity.ts", "help"]).stdout.toString();
    for (const c of [
      "prove",
      "report",
      "serve",
      "capture",
      "rebuild",
      "explore",
      "record",
      "export",
      "film",
      "models",
    ]) {
      expect(out).toContain(`  ${c}`);
    }
    const line = (c: string) => out.split("\n").find((l) => l.startsWith(`  ${c} `)) ?? "";
    expect(line("capture")).toContain("model calls");
    expect(line("prove")).not.toContain("model calls");
  });

  test("an unknown command fails with code 2", () => {
    const p = run(["bin/parity.ts", "nope"]);
    expect(p.exitCode).toBe(2);
    expect(p.stderr.toString()).toContain('Unknown command "nope"');
  });
});

describe("pull request summary", () => {
  test("a difference leads, with both values in a table", () => {
    const md = summaryOf(
      "Virtual Salesman 3",
      "http://127.0.0.1:4173/",
      result(screen("69.21"), screen("69.22")),
    );
    expect(md).toStartWith("### No parity: 1 field differs");
    expect(md).toContain("| Total | sc, step 6 | 69.21 | 69.22 |");
    expect(md).toContain("over 1 checkpoint replayed twice");
  });

  test("parity is one line", () => {
    expect(summaryOf("a", "b", result(screen("1"), screen("1")))).toStartWith(
      "### Parity: every field matches",
    );
  });

  test("text from the apps cannot break the table or inject markup", () => {
    const md = summaryOf("a", "b", result(screen("1|2\n### x <img src=x>", "To|tal"), screen("3", "To|tal")));
    expect(md).not.toContain("\n### x");
    expect(md).not.toMatch(/(^|[^\\])<img/);
    expect(md).toContain("To\\|tal");
  });
});

describe("static server for examples", () => {
  const server = Bun.spawn(
    [process.execPath, "scripts/serve-static.ts", "examples/invoice", "--port", "4199"],
    { cwd: root, stdout: "pipe", stderr: "pipe" },
  );
  afterAll(() => server.kill());
  const get = async (path: string) => {
    for (let i = 0; i < 50; i++) {
      try {
        return await fetch(`http://127.0.0.1:4199${path}`);
      } catch {
        await Bun.sleep(100);
      }
    }
    throw new Error("server did not start");
  };

  test("serves the example and refuses paths outside its folder", async () => {
    expect((await get("/")).status).toBe(200);
    expect((await get("/parity.proof.json")).status).toBe(200);
    expect((await get("/..%2F..%2Fpackage.json")).status).toBe(403);
    expect((await get("/missing.html")).status).toBe(404);
  });
});
