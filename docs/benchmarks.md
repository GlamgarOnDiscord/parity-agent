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

## Differential fuzzing of the FrontAccounting rebuild (2026-10-27)

`parity fuzz fixtures/fuzz/fa-invoice.json --proof runs/fa/proof.json --reference-url http://127.0.0.1:8080/ --app generated/fa/app --seed 1 --count 12 --repair`

The spec draws 1 to 4 lines per invoice from the six items of the demo data, quantities from 1 to 999 and six discounts. Each case is played on live FrontAccounting and on the rebuild at the same time, and compared field by field. A case that differs is shrunk: lines dropped, optional inputs left out, values moved toward the simplest one, and a case is only kept if every label that first differed still differs.

| step | result | spend |
|---|---|---|
| 12 cases, seed 1, on the rebuild that had parity on the recorded scenario | 9 of 12 differ: items 201, 202 and 301, never shown in the recording, came out as the default item at 250.00 | none |
| Shrinking | each kind of difference, first seen on invoices of up to 3 lines and quantities up to 918, reduced to quantity 1 on one line, or two when the tax difference needs a priced line beside the free one; 7 to 20 replays each | none |
| First two repairs, prompt without the inputs | no fix: Muse Code got the expected descriptions but not which item code showed them, and swapped 201 and 202 | $1.22 |
| Repair prompt now names the inputs and the line of each difference | parity on the 7 scenarios of the proof | $0.46 |
| Seed 1 again, then seeds 2 and 3 never used before | 52 cases, parity on every one | none |

What it found was data, not arithmetic: line totals, the included tax and thousands formatting held on every case, and the item master was missing. A first run also caught two faults in Parity itself, now fixed and tested: `1200.00` was read as a plain number and compared as text against `1,200.00`, and shrinking drifted from one difference to another one already reported.

Not covered yet: item codes that do not exist. The rebuild still falls back to a default item where FrontAccounting refuses the line; adding an unknown code to the spec is the next case to find.

## Differences people decide, from the diff screen (2026-10-28)

| action | result | spend |
|---|---|---|
| Accept the cent on Virtual Salesman 3 (69.21 before, 69.22 after) as "the legacy app was wrong", with a name and a reason | stored in the proof, verdict "Parity, 1 accepted", listed in the report and the pull-request summary; it holds for these two values only | none |
| Send to Muse Code, FrontAccounting rebuild with item 301 removed (7 differences) | item 301 back; Parity's replay right after caught a new difference: included tax 11.91 before, 11.90 after on item 102 | $0.41 |
| Send to Muse Code again | still 11.90: Muse Code tried a tax per line | $0.40 |

The regression came from the spec: the rule read from the recording says included tax = sub-total × 5 / 105, and Muse Code rewrote the working formula to follow it. FrontAccounting rounds the base before it computes the tax. The repair prompt now says the legacy values win over a formula from the spec. One failing example is not enough to infer a rounding rule; the next step is to fuzz around a numeric difference and hand Muse Code a table of inputs and legacy values.

## Exploration that writes tests, and a rounding rule found from examples (2026-10-30)

A numeric difference the repair could not settle in D5: the rebuild shows Included Tax 11.90 where FrontAccounting shows 11.91 on a 250.00 line. `parity fuzz --repair` now plays the cases around the shrunk one on both apps and gives Muse Code a table of inputs and the values each app showed, the cases that differ first.

| Repair | Table | Spend | Result |
| --- | --- | --- | --- |
| 1 | 9 neighbours, 1 differing (the case itself) | $0.48 | still 11.90: Muse Code went back to `sub * 5 / 105` |
| 2 | 24 neighbours searched, the 2 differing listed first | $0.36 | PARITY: `round2(round3(sub * 5 / 105))`, a double rounding |

After repair 2: seeds 7, 8 and 9 (60 cases the repair never saw) at parity, and the whole proof at parity. One example cannot tell a rounding rule from a typo; two that differ, next to cases that agree, did.

Exploration then wrote a test. `bun run explore ... --ack computer_action_requires_confirmation --save` (8 model steps, $0.071, ended by a 500 from the API) found Sales Types, a screen no person recorded, with Tax included and Calculation factor. Meta asked to confirm 7 of the 8 steps, so the scenario was held back until its one step (`click "Sales Types"` after the login) was read and approved with `--from ... --save-acknowledged`, at no model cost. Replayed on FrontAccounting: 10 of 10 fields equal. Replayed on the rebuild: it fails at the login, because the rebuild only has the invoice screen. That gap is what migration mode (D7) is for.

D6 spend so far: $0.91.

