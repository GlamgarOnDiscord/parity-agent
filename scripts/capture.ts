// Capture a screen recording and extract its rules: bun run capture [video] [--out dir] [--sam "button,input box"]
import { basename, extname, join } from "node:path";
import { parseArgs } from "node:util";
import { capture } from "../src/capture/capture";
import { loadConfig } from "../src/config";
import { createModels } from "../src/models";
import { Ledger } from "../src/models/ledger";
import { extractRules } from "../src/rules/extract";
import { RuleStore } from "../src/rules/store";
import { openDb } from "../src/store/db";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { out: { type: "string" }, sam: { type: "string", default: "button,input box" } },
});
const video = positionals[0] ?? "runs/sample/recording.mp4";
const out = values.out ?? join("runs", basename(video, extname(video)));
const config = loadConfig();
const db = openDb(config.PARITY_DB);
const ledger = new Ledger(db);
const models = createModels(config, ledger);
const runId = basename(out);

const c = await capture(video, out, models, {
  runId,
  sam: values.sam
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean),
});
console.log(
  `\n${video}: ${c.duration.toFixed(1)} s, ${c.frames.length} key frames, ${c.transcript.length} narration lines`,
);
for (const l of c.transcript) console.log(`  [${l.start.toFixed(1)}s] ${l.text}`);
for (const [i, f] of c.frames.entries()) {
  console.log(
    `  frame ${i + 1} at ${f.t.toFixed(1)}s, ${f.screen.fields.length} fields, ${f.objects.length} SAM objects`,
  );
}
const last = c.frames.at(-1);
if (last) console.log(`  last frame: ${last.screen.fields.map((f) => `${f.label}=${f.value}`).join("; ")}`);

const rulesFile = join(out, "rules.json");
const rules = (await Bun.file(rulesFile).exists())
  ? await Bun.file(rulesFile).json()
  : await extractRules(c, models, runId);
await Bun.write(rulesFile, JSON.stringify(rules, null, 2));
new RuleStore(db).save(runId, rules);

console.log(`\n${rules.length} rules`);
for (const r of rules) {
  const check = r.check
    ? ` [${r.check.verified} verified, ${r.check.contradicted} contradicted${r.escalated ? ", escalated" : ""}]`
    : "";
  console.log(`  ${r.id} ${r.title}${check}`);
  console.log(`      ${r.statement}`);
  if (r.expression) console.log(`      ${r.target} = ${r.expression}`);
  for (const q of r.evidence.quotes) console.log(`      "${q.text}" (${q.start.toFixed(1)}s)`);
}
const total = ledger.total(runId);
console.log(
  `\n${total.calls} model calls, $${total.costUsd.toFixed(4)}, ${(total.sentBytes / 1024).toFixed(0)} KB sent`,
);
