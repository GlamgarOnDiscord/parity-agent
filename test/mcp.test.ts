import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createParityMcp } from "../src/mcp/server";
import type { Rule } from "../src/rules/extract";
import { RuleStore } from "../src/rules/store";
import { openDb } from "../src/store/db";

const root = join(import.meta.dir, "..");
const runsDir = mkdtempSync(join(tmpdir(), "parity-mcp-runs-"));
mkdirSync(join(runsDir, "inv"));
const proof = await Bun.file(join(root, "examples/invoice/parity.proof.json")).json();
writeFileSync(join(runsDir, "inv", "proof.json"), JSON.stringify(proof));
writeFileSync(
  join(runsDir, "inv", "capture.json"),
  JSON.stringify({
    video: "v",
    duration: 1,
    transcript: [],
    frames: [
      {
        t: 0,
        path: "f",
        objects: [],
        screen: {
          id: "s",
          app: "a",
          fields: [
            { id: "t", label: "Total", value: "69.21" },
            { id: "c", label: "Comment", value: "" },
          ],
        },
      },
    ],
  }),
);
const db = openDb(":memory:");
const store = new RuleStore(db);
const rule: Rule = {
  id: "R-01",
  title: "Total rounds once",
  statement: "The total adds the unrounded taxes and rounds once.",
  kind: "computation",
  target: "Total",
  expression: "round({Sub Total} * 1.14975, 2)",
  fields: ["Sub Total", "Total"],
  evidence: { frames: [], quotes: [] },
  escalated: false,
  model: "muse-spark-1.3",
  confidence: 0.9,
  check: { verified: 6, contradicted: 0, untestable: 0, examples: [] },
};
store.save("inv", [rule]);

const server = createParityMcp({ root, runsDir, rules: store, parityBin: join(root, "bin", "parity.ts") });
const [a, b] = InMemoryTransport.createLinkedPair();
await server.connect(a);
const client = new Client({ name: "test", version: "1" });
await client.connect(b);
const call = async (name: string, args: Record<string, unknown> = {}) => {
  const r = await client.callTool({ name, arguments: args });
  return { error: Boolean(r.isError), text: (r.content as { text: string }[]).map((c) => c.text).join("\n") };
};

afterAll(async () => {
  await client.close();
  rmSync(runsDir, { recursive: true, force: true });
});

describe("Parity MCP server", () => {
  test("lists its tools, all read-only", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(["coverage", "prove", "rules", "runs"]);
    expect(tools.every((t) => t.annotations?.readOnlyHint)).toBe(true);
  });

  test("runs, rules and coverage read the project", async () => {
    expect((await call("runs")).text).toContain("inv: proof, capture");
    const rules = await call("rules", { run: "inv" });
    expect(rules.text).toContain("R-01 Total rounds once [pending]");
    expect(rules.text).toContain("6 frames reproduce it");
    const cov = await call("coverage", { run: "inv" });
    expect(cov.text).toContain("never tested: Comment");
  });

  test("refuses paths outside the project and apps off this machine", async () => {
    expect((await call("prove", { proof: "../../etc/passwd", url: "http://127.0.0.1:1/" })).error).toBe(true);
    const remote = await call("prove", {
      proof: "examples/invoice/parity.proof.json",
      url: "https://example.com/",
    });
    expect(remote.error).toBe(true);
    expect(remote.text).toContain("running on this machine");
    expect((await call("prove", { proof: "package.json", url: "http://127.0.0.1:1/" })).text).toContain(
      "not a Parity proof",
    );
    expect((await call("rules", { run: "../x" })).error).toBe(true);
  });

  test("prove replays the example and returns the verdict", async () => {
    const serve = Bun.spawn(
      [process.execPath, "scripts/serve-static.ts", "examples/invoice", "--port", "4198"],
      { cwd: root, stdout: "pipe", stderr: "pipe" },
    );
    try {
      for (let i = 0; i < 50; i++) {
        if (
          await fetch("http://127.0.0.1:4198/").then(
            () => true,
            () => false,
          )
        )
          break;
        await Bun.sleep(100);
      }
      const r = await call("prove", {
        proof: "examples/invoice/parity.proof.json",
        url: "http://127.0.0.1:4198/",
      });
      expect(r.error).toBe(false);
      expect(r.text).toContain("### Parity: every field matches");
      expect(r.text).toContain("Exit code: 0");
    } finally {
      serve.kill();
    }
  }, 60_000);
});
