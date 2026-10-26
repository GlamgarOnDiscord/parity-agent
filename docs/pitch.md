# Hackathon pitch: Parity Proof

## One line

Record your app once; Parity replays it before and after any change and shows every field that moved, with proof, and nothing leaves your machine unless you send it.

Demo: an old Windows sales app rebuilt as a web app by Muse Code, proven to compute the same thing to the cent.

## Against the judging criteria

**Impact (30 %).** Code changes that nobody fully checks: AI-agent pull requests, legacy migrations. The bugs that slip through are business bugs, such as an invoice total one cent off while every test passes. The proof is open and readable by the owner, not only the developer. Real figures: the TSB migration (330 M GBP), and the one-cent tax-on-tax gap found on Virtual Salesman 3.

**Meta tooling (25 %).** Every model has a visible job, with a badge on screen:

| model | job in the demo |
|---|---|
| Muse Voice Transcribe | transcribes the employee narrating their use |
| SAM 3.1 | segments the fields of the old UI (masks shown) |
| Muse Spark, computer use | explores the app alone in the Wine sandbox |
| Muse Spark | writes the business rules, explains the differences |
| Muse Code | generates the new web app, repairs it until zero differences |
| Muse Wonder | settles hard cases ("escalated" badge) |
| Muse Spark Open (Baseten) | same rule extraction on open weights, for those who keep data in-house |

**Technical depth (20 %).** Behavior captured from a Windows binary with no source, under Wine, in 165 MB. Field matching across two UIs that look nothing alike. Deterministic comparison: AI never decides what "the same" means. Volatile-field masking (the top complaint against competitors). A diff-guided Muse Code repair loop. "AI captures and explains; code proves."

**Demo (25 %).** The 3-minute video:

| time | on screen |
|---|---|
| 0:00-0:15 | Two invoices side by side, 69.21 and 69.22. "Every test passes. The total is wrong." |
| 0:15-0:40 | The problem: AI agents and legacy migrations change code nobody fully checks |
| 0:40-1:20 | Capture: narration transcribed, SAM masks, rules in plain language, one rule accepted in a click |
| 1:20-2:00 | Muse Code rebuilds the app; Parity replays; the diff shows the cent and why |
| 2:00-2:30 | Repair: the difference turns green; coverage map shows what was not tested; one-page report signed |
| 2:30-2:50 | Second app (FrontAccounting), one the founder did not write |
| 2:50-3:00 | "Any app, before and after any change. Open source." Logo |

Rule: everything shown runs for real. No mock.

## Wins and losses

To win: one strong moment repeated (the cent); proof on an app the founder did not write; Meta models visible at each step; local by default.

To lose: a diagram instead of a product; "any software" claimed without proof; a diff drowned in false positives; a half-finished pipeline.

Cut list frozen on day 3. Optional: autonomous exploration, FrontAccounting, Playwright export. Never cut: field matching, replay, masking, the one-cent catch, the report.

## Bonus prizes in the same work

- Most Viral on X (20k USD): a daily clip from Oct 27 to Nov 4.
- Open Weights (10k USD): Muse Spark Open on Baseten.
- Agentic (5k USD): computer-use exploration, if it holds.

Evidence behind these choices: `founder/` (board, competitors, buyer panel, offer, CFO, launch plan).
