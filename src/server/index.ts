import { loadConfig } from "../config";
import { Ledger } from "../models/ledger";
import { RuleStore } from "../rules/store";
import { openDb } from "../store/db";
import { createApp } from "./app";

const config = loadConfig();
const db = openDb(config.PARITY_DB);
const ledger = new Ledger(db);
const token = config.PARITY_TOKEN ?? crypto.randomUUID();
const app = createApp(ledger, { token, port: config.PARITY_PORT, rules: new RuleStore(db), runsDir: "runs" });

// Local only: the server never listens on a public interface.
const server = Bun.serve({ hostname: "127.0.0.1", port: config.PARITY_PORT, fetch: app.fetch });
console.log(`Parity on http://${server.hostname}:${server.port}`);
console.log(`API token for this launch: ${token}`);
