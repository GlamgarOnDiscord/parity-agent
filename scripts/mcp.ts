// Parity as an MCP server on stdio, for coding agents: parity mcp [--proof <file> --app <dir>].
// With --proof and --app the server is pinned to that one proof and app (used when Muse Code repairs an app).
// No model call; nothing leaves this machine.
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "../src/config";
import { createParityMcp } from "../src/mcp/server";
import { RuleStore } from "../src/rules/store";
import { openDb } from "../src/store/db";

const root = resolve(import.meta.dir, "..");
const { values } = parseArgs({ options: { proof: { type: "string" }, app: { type: "string" } } });
if (Boolean(values.proof) !== Boolean(values.app)) throw new Error("pin both --proof and --app, or neither");
const config = loadConfig();
const server = createParityMcp({
  root,
  runsDir: join(root, "runs"),
  rules: new RuleStore(openDb(config.PARITY_DB)),
  parityBin: join(root, "bin", "parity.ts"),
  pinned: values.proof && values.app ? { proof: resolve(values.proof), app: resolve(values.app) } : undefined,
});
await server.connect(new StdioServerTransport());
