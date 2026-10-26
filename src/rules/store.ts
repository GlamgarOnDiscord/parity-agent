import type { Database } from "bun:sqlite";
import type { Rule } from "./extract";

export type RuleStatus = "pending" | "accepted" | "rejected";

export interface StoredRule extends Rule {
  runId: string;
  status: RuleStatus;
  decidedAt: string | null;
  note: string | null;
}

interface Row {
  run_id: string;
  body: string;
  status: RuleStatus;
  decided_at: string | null;
  note: string | null;
}

const toRule = (r: Row): StoredRule => ({
  ...(JSON.parse(r.body) as Rule),
  runId: r.run_id,
  status: r.status,
  decidedAt: r.decided_at,
  note: r.note,
});

/** Rules waiting for, or carrying, the expert's decision. Re-saving a run keeps decisions already made. */
export class RuleStore {
  constructor(private readonly db: Database) {}

  save(runId: string, rules: Rule[]): void {
    const upsert = this.db.query(
      `INSERT INTO rules (run_id, rule_id, body) VALUES (?, ?, ?)
       ON CONFLICT (run_id, rule_id) DO UPDATE SET body = excluded.body`,
    );
    this.db.transaction(() => {
      for (const r of rules) upsert.run(runId, r.id, JSON.stringify(r));
    })();
  }

  list(runId: string): StoredRule[] {
    return this.db
      .query<Row, [string]>(
        "SELECT run_id, body, status, decided_at, note FROM rules WHERE run_id = ? ORDER BY rule_id",
      )
      .all(runId)
      .map(toRule);
  }

  runs(): { runId: string; rules: number; pending: number }[] {
    return this.db
      .query<{ runId: string; rules: number; pending: number }, []>(
        `SELECT run_id AS runId, COUNT(*) AS rules, SUM(status = 'pending') AS pending
         FROM rules GROUP BY run_id ORDER BY run_id`,
      )
      .all();
  }

  decide(
    runId: string,
    ruleId: string,
    status: Exclude<RuleStatus, "pending">,
    note?: string,
  ): StoredRule | null {
    const row = this.db
      .query<Row, [string, string | null, string, string, string]>(
        `UPDATE rules SET status = ?, note = ?, decided_at = ? WHERE run_id = ? AND rule_id = ?
         RETURNING run_id, body, status, decided_at, note`,
      )
      .get(status, note ?? null, new Date().toISOString(), runId, ruleId);
    return row ? toRule(row) : null;
  }
}
