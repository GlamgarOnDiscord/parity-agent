# Benchmarks

Measured on the development laptop (Windows 11, Bun 1.3.1, headless Chrome, Docker Desktop on WSL 2). No model call in any of these runs.

## FrontAccounting 2.4.20, noise (2026-10-26)

Scenario: [fixtures/scenarios/frontaccounting-invoice.json](../fixtures/scenarios/frontaccounting-invoice.json). Log in, open a direct sales invoice, add 3 iPads at 10 % off, check, add 2 covers, check, place the invoice. Upstream demo data, fresh database (`down` then `up`), 5 runs with `bun run record:reference`.

| measure | value |
|---|---|
| Fields read at the two checkpoints | 63 |
| Fields that changed between runs | 4 (6 %) |
| Replay time per run, median | 3.3 s (3.25 to 3.32 s) |
| Self-check with `bun run prove` | parity: 55 equal, 0 different, 8 masked |
| One cent changed in the proof (`Amount Total` 910.00 to 910.01) | caught: 1 different |

What the noise is, field by field:

- `Reference:` is the next invoice number (002/2022, then 003/2022...). Every placed invoice moves it.
- `Item Description @ entry`, `Price after Tax @ entry`, `Total @ entry` are the empty line-entry row, which FrontAccounting pre-fills with the last item sold. The first run on a fresh database shows the default item, later runs show the cover case.

The invoice lines and every total are compared in all runs; none of them is noise.

How noise is named: a bare label masks that label everywhere (`Reference:`). When a label repeats across a grid, the name is narrowed to the row (`Total @ row-2`) or to the entry row (`Total @ entry`), so masking the entry row never hides a real line total.

## Reading old table layouts

FrontAccounting labels its fields with table cells, not `<label>` elements. The page reader (`src/drivers/read-fields.ts`, shared with the Playwright export) takes a label from a `td.label` cell, the text cell before a value, or the column header of a grid, numbers grid rows among data rows, and reads totals rows under a grid by their own text. Nothing is specific to FrontAccounting.

## Autonomous exploration of FrontAccounting (2026-10-26)

`bun run explore fixtures/proofs/frontaccounting-invoice.json --url http://127.0.0.1:8080/ --steps 12 --max-usd 0.5 --ack computer_action_requires_confirmation`

The driver logs in from the proof's first steps, then Muse Spark computer use drives alone. The browser can reach 127.0.0.1:8080 and nothing else. After every step Parity reads the screen without AI and keeps it when at least half of its labels are new to the proof.

| measure | value |
|---|---|
| Model steps | 12 (13 clicks, no typing) |
| Cost | $0.153 |
| Safety checks | 12, all `computer_action_requires_confirmation`, acknowledged under `--ack` |
| New screens the recording never showed | 4 |

| step | screen | rule-bearing fields |
|---|---|---|
| 2 | Inventory Item Sales prices | price per sales type and currency |
| 4 | Supplier Purchasing Data | supplier price, unit conversion factor |
| 9 | System and General GL Setup | tax algorithm, past due days |
| 11 | Tax Types | default rate (5.0 %), GL accounts |

## FrontAccounting end to end (2026-10-27)

The whole pipeline on an app nobody here wrote, with the legacy side replayed live rather than recorded.

| step | result | spend |
|---|---|---|
| Narrated tour filmed in the sandbox (`parity tour`, Windows speech) | 39 s, 5 scenes | none |
| Capture: transcript, 4 key frames, fields per frame, rules | 4 rules | $0.10 |
| Reference recorded live through an adapter (login prelude, path map) | 65 fields, 0 noisy over 3 runs | none |
| Rebuild by Muse Code, 3 iterations with self-check over MCP | all fields but one row pairing | $6.73 as logged |
| Targeted repair: row groups (contract rule 7) | parity, 65 of 65 fields | $0.32 |

The rebuild cost is logged at the full input price; Muse Code reports about 1.7 million input tokens per self-checking iteration, part of them likely served from its cache. The self-check loop is the expensive part: one short targeted repair cost 20 times less than one self-checking iteration.

### Rules extracted against rules observed by hand

Rules observable on this invoice screen, written down by hand from FrontAccounting's behaviour, compared with what capture proposed from the recording:

| rule observed by hand | extracted |
|---|---|
| Line total = quantity × price × (1 − discount % / 100) | R-01, formula checked on 2 frames |
| Sub-total = sum of the line totals | R-02 |
| Retail prices include the tax | R-03 states it ("already included") |
| Included tax = sub-total × 5 / 105, to the cent | R-03, formula checked on 2 frames; never said in the narration |
| Amount total = sub-total + shipping | R-04, formula checked on 4 frames |
| After Add Item the entry row resets to the default item, quantity 1 | missed |

Five of six rules found, no wrong rule proposed. Two formulas show contradictions on some frames: the capture read the empty entry row as a line, so its 250.00 entered the sums. The live proof has no such confusion: grid rows and the entry row are grouped by the page reader.
