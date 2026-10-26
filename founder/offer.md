# Offer: Parity

Inputs: [idea](idea.md), [pitch v1](pitch-v1.md), [panel](panel-v1/results.md) (3 of 20 adopt, 15 %), [board](board.md), [pricing](pricing.md). Costs are effort and Meta credits, not money (see [cfo](cfo.md)).

## Problem list (buyer's words first, from the panel)

Before adopting
1. "Security would ask what gets sent to Meta's models" (P002, P005, P012, P013, P015, P020)
2. "An AI decides what counts as the same behavior" (P003, P011, P012, P016, P019)
3. "If it misses a rule, I get a green diff and false confidence" (P012, P016, P019)
4. "A free student project: who maintains it next year?" (P005, P010, P019)
5. "Toy demos always look clean" (P002, P018, P020)
6. "My tests already catch what the agent breaks" (P007, P008, P011)
7. "Recording plus checking AI-written rules is a second test suite to babysit" (P007, P008)

During setup
8. "Docker or Wine is a weekend of configuration" (P014, P017)
9. "More than the hour I have" (P003, P004, P013)
10. "Does it get past login and seed realistic data?" (P020)
11. "What do Meta's models cost me in keys or hardware?" (P006, P010)

During use
12. "Timestamps and IDs will bury me in false diffs" (P006, P007, P008, P020)
13. "Intended changes show up as differences" (P008)
14. Reviewing a long rule list (board, P003)

After
15. "I'm the one telling the client the migration is safe" (P011)
16. "Whoever I pay to migrate should prove it, not me" (P003, P009, P014, P017)
17. Lock-in: what is left if the project dies (P019)

## Solutions, scored (value 1-5, cost to build in 9 days 1-5, 5 = expensive)

| # | solution | value | cost | keep |
|---|---|---:|---:|---|
| 1, 11 | **Local by default**: replays, diffs and the rule store run offline with no AI; capture runs on Meta's API or on Muse Spark Open (open weights you can host); a send log lists every model call | 5 | 2 | core |
| 2, 3 | **The AI never judges equality**: comparison is plain deterministic code; AI proposes rules (you accept) and explains diffs; a coverage map shows what was not explored | 5 | 2 | core |
| 12, 13 | **Noise control**: volatile fields (timestamps, ids) detected and masked on the first run, intended changes accepted once and remembered | 5 | 3 | core |
| 5, 6 | **Proof on a real bug in the README**: an AI refactor passes the tests and changes an invoice total by one cent; Parity catches it (Virtual Salesman 3 and a web app) | 5 | 2 | bonus |
| 4, 17 | **No lock-in**: every proven scenario exports as plain Playwright tests and an open JSON proof format you keep | 4 | 3 | bonus |
| 8, 9 | **One command for web apps**; Windows apps through a ready-made sandbox image | 4 | 3 | bonus |
| 15, 16 | **One-page parity report** a provider hands to the owner: verdict, each difference with evidence, sign-off | 4 | 2 | bonus |
| 14 | Rule review in a few clicks, sorted by risk | 3 | 2 | in core UI |
| 10 | Login and data seeding helpers | 3 | 4 | cut (later) |
| 7 | Run on every pull request in CI | 4 | 4 | cut (after hackathon) |

## The stack

- **Core: "Parity Proof".** Record your app once; get a replayable proof. After any change, Parity replays it on both versions and shows every field that differs, with evidence, offline.
- **Bonus 1: the one-cent demo.** Kills "toy demos" and "my tests already do this".
- **Bonus 2: keep your tests.** Playwright export plus open proof format. Kills "who maintains it" and lock-in.
- **Bonus 3: the owner's report.** One page, signed. Kills "whoever migrates should prove it".
- **Guarantee: "Every field matches, or every difference is shown with its evidence. Nothing leaves your machine unless you send it."** Cost: zero money; it is a design commitment, testable in the demo.
- **Urgency:** none faked. The only real date is the hackathon submission.
- **Name:** Parity Proof.

## Value equation (1-10, before, after)

| element | before | after | moved by |
|---|---:|---:|---|
| dream outcome | 7 | 8 | owner's report (someone can sign) |
| likelihood | 2 | 6 | deterministic diff, coverage map, the real one-cent demo |
| time to result | 4 | 6 | one command for web apps |
| effort and sacrifice | 3 | 6 | local by default, noise control, Playwright export |

## Re-test

Pitch v2 in [pitch.md](pitch.md) (v1 kept as [pitch-v1.md](pitch-v1.md)), same 20 cards (seed 26) in `founder/panel/`. Result: see the section below once the panel finishes.

## Re-test result (same 20 cards, seed 26)

| | pitch v1 | pitch v2 (this offer) |
|---|---:|---:|
| Adopt (try it) | 3 / 20 (15 %) | **8 / 20 (40 %)** |
| Pass for trust | 10 | 4 |
| Pass for convenience | 5 | 6 |
| Pass for habit or need | 2 | 2 |

What moved: "Skeptical of AI tools" went from 0 of 4 to 3 of 4. The deterministic comparison and local-by-default answered them. IT consultants (0 % to 50 %) and freelancers (0 % to 50 %) moved most.

What did not move: buyers who need approval, firefighters and non-technical owners stayed at 0 %. Their blockers are not in the offer: someone else has to run it for them (a provider, a hosted version), and someone has to stand behind it (maintenance, support). Several buyers also discount the one-cent demo as "hand-picked"; the README needs a second example on an app the founder did not write (FrontAccounting).

Every yes is a free trial, not a commitment; several buyers say they would drop it after one noisy run. Noise control is the make-or-break feature, which matches the top complaint about competitors.

Detail: [panel/results.md](panel/results.md).
