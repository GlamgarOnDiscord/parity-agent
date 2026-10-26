import { loadConfig } from "../config";
import { Ledger } from "../models/ledger";
import { openDb } from "../store/db";
import { createApp } from "./app";

const config = loadConfig();
const ledger = new Ledger(openDb(config.PARITY_DB));
const app = createApp(ledger);

// Local only: the server never listens on a public interface.
const server = Bun.serve({ hostname: "127.0.0.1", port: config.PARITY_PORT, fetch: app.fetch });
console.log(`Parity on http://${server.hostname}:${server.port}`);
