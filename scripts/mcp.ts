// Parity as an MCP server on stdio, for coding agents: parity mcp. No model call; nothing leaves this machine.
import { join, resolve } from "node:path";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "../src/config";
import { createParityMcp } from "../src/mcp/server";
import { RuleStore } from "../src/rules/store";
import { openDb } from "../src/store/db";

const root = resolve(import.meta.dir, "..");
const config = loadConfig();
const server = createParityMcp({
  root,
  runsDir: join(root, "runs"),
  rules: new RuleStore(openDb(config.PARITY_DB)),
  parityBin: join(root, "bin", "parity.ts"),
});
await server.connect(new StdioServerTransport());
