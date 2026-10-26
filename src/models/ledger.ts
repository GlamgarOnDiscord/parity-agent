import type { Database } from "bun:sqlite";
import { costOf, type Usage } from "./pricing";

export interface CallRecord {
  runId?: string;
  role: string;
  provider: string;
  model: string;
  usage: Usage;
  sentBytes: number;
  durationMs: number;
  ok: boolean;
  error?: string;
}

/** Error text is stored for debugging, never secrets: keys and bearer tokens are masked, length is capped. */
export function redact(text: string): string {
  return text
    .slice(0, 2000)
    .replace(/Bearer\s+[\w.~+/=-]+/gi, "Bearer [redacted]")
    .replace(/\b(key|api[_-]?key)[=:\s]+[\w-]{12,}/gi, "$1 [redacted]")
    .replace(/\b(sk|pk)-[\w-]{12,}/gi, "$1-[redacted]")
    .slice(0, 500);
}

export interface LoggedCall extends CallRecord {
  id: number;
  at: string;
  costUsd: number;
}

/** The send log: every call that leaves the machine, with what it cost. */
export class Ledger {
  constructor(private readonly db: Database) {}

  record(call: CallRecord): LoggedCall {
    const { usd } = costOf(call.model, call.usage);
    const at = new Date().toISOString();
    const units = call.usage.images ?? call.usage.audioSeconds ?? 0;
    const unitKind = call.usage.images ? "images" : call.usage.audioSeconds ? "audio-seconds" : null;
    const row = this.db
      .query<{ id: number }, (string | number | null)[]>(
        `INSERT INTO model_calls (run_id, at, role, provider, model, input_tokens, output_tokens, units, unit_kind,
          sent_bytes, cost_usd, duration_ms, ok, error)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      )
      .get(
        call.runId ?? null,
        at,
        call.role,
        call.provider,
        call.model,
        call.usage.inputTokens ?? 0,
        call.usage.outputTokens ?? 0,
        units,
        unitKind,
        call.sentBytes,
        usd,
        call.durationMs,
        call.ok ? 1 : 0,
        call.error ? redact(call.error) : null,
      );
    return { ...call, id: row?.id ?? 0, at, costUsd: usd };
  }

  list(runId?: string, limit = 200) {
    const sql = `SELECT id, run_id AS runId, at, role, provider, model, input_tokens AS inputTokens,
      output_tokens AS outputTokens, units, unit_kind AS unitKind, sent_bytes AS sentBytes, cost_usd AS costUsd,
      duration_ms AS durationMs, ok, error FROM model_calls ${runId ? "WHERE run_id = ?" : ""}
      ORDER BY id DESC LIMIT ?`;
    const args = runId ? [runId, limit] : [limit];
    return this.db.query(sql).all(...args);
  }

  total(runId?: string): { calls: number; costUsd: number; sentBytes: number } {
    const sql = `SELECT COUNT(*) AS calls, COALESCE(SUM(cost_usd), 0) AS costUsd,
      COALESCE(SUM(sent_bytes), 0) AS sentBytes FROM model_calls ${runId ? "WHERE run_id = ?" : ""}`;
    const row = this.db
      .query<{ calls: number; costUsd: number; sentBytes: number }, string[]>(sql)
      .get(...(runId ? [runId] : []));
    return row ?? { calls: 0, costUsd: 0, sentBytes: 0 };
  }
}
