import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const MIGRATIONS = [
  `CREATE TABLE runs (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE model_calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT,
    at TEXT NOT NULL,
    role TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    units REAL NOT NULL DEFAULT 0,
    unit_kind TEXT,
    sent_bytes INTEGER NOT NULL DEFAULT 0,
    cost_usd REAL NOT NULL,
    duration_ms INTEGER NOT NULL,
    ok INTEGER NOT NULL,
    error TEXT
  )`,
  "CREATE INDEX model_calls_run ON model_calls (run_id)",
  `CREATE TABLE rules (
    run_id TEXT NOT NULL,
    rule_id TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    decided_at TEXT,
    note TEXT,
    PRIMARY KEY (run_id, rule_id)
  )`,
];

export function openDb(path: string): Database {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path, { strict: true });
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  migrate(db);
  return db;
}

function migrate(db: Database): void {
  db.exec("CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)");
  const row = db.query<{ version: number }, []>("SELECT version FROM schema_version").get();
  const current = row?.version ?? 0;
  if (current >= MIGRATIONS.length) return;
  db.transaction(() => {
    for (const sql of MIGRATIONS.slice(current)) db.exec(sql);
    db.exec("DELETE FROM schema_version");
    db.query("INSERT INTO schema_version (version) VALUES (?)").run(MIGRATIONS.length);
  })();
}
