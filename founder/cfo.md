# CFO note: Parity

Parity is free today, so there is no margin yet. This file has two parts: what the hackathon really costs (Meta credits), and a scenario for a later hosted tier, run through the CFO tool. The scenario is not the plan.

## 1. The hackathon budget: $150 of Meta credits

Prices from `docs/meta-model-api.md` in the private repo (checked against dev.meta.ai on 2026-10-20). Token counts are **estimates** for one Virtual Salesman 3 scenario; measure them on day 1 and replace.

| step | cost |
|---|---:|
| Narration transcription, 1 min (muse-voice-transcribe, $0.18/h) | $0.00 |
| SAM 3.1, 31 key frames ($2.50 per 1k images) | $0.08 |
| Muse Spark, screen understanding: 67k in, 10k out | $0.13 |
| Muse Spark computer use, exploration: 40 steps, 480k in, 20k out | $0.69 |
| Muse Spark, rule extraction: 150k in, 15k out | $0.25 |
| Muse Code, generate and repair: 3M in, 300k out (priced as Spark, estimate) | $5.03 |
| Muse Spark, explain 10 diffs: 50k in, 5k out | $0.08 |
| **One full run (capture to repaired app)** | **$6.25** |
| One capture without code generation | $1.23 |

With $150: about 23 full runs, or about 122 captures without code generation.

**The line to watch: code generation.** Muse Code is about 80% of a full run. Three ways to protect the budget:
1. Generate the app once, then repair only the files a diff points to (cuts the 3M-token estimate several times over).
2. Cache every capture and rule extraction; replays and diffs never call a model.
3. Run bulk rule extraction on Muse Spark Open (Baseten), which also scores for the open-weights bonus prize.

Keep a hard stop: an alert at $100 spent, the demo recording done before $130.

## 2. Scenario: a hosted Team tier after the hackathon ($29 per app per month)

- **Margin:** each app-month leaves **$22.66 (78%)** after model calls, replay compute and card fees; at 40 apps a month the margin is **74%**.
- **Break-even:** 3 paying apps a month cover the $46 of fixed costs.
- **Cash needed:** **$108** before it pays for itself; earned back in month 5.
- **The line that matters most is not in the table:** the founder's time is costed at $0. Year 1 operating profit of $3,527 is pocket money, not a salary. Volume, not margin, is the problem.
- **Three ways to improve it:** price at the panel's indifference point ($32.25) instead of $29 (about +$390 in year 1 at the same volume); sell the one-off migration report ($490 to $990) to IT providers, where one sale equals 17 to 34 app-months; cut replay compute by running replays on the customer's own machine (the variable cost drops from $6.34 to about $3.34).
- **Board conditions about money:** none of them were about money; they were about focus and proof. Met by this note: none. This is not financial, tax or legal advice; an accountant checks the structure before any money moves.

---

# Unit economics: Parity, SCENARIO ONLY: a possible hosted Team tier after the hackathon (the product is free today)

Every number below comes from the input file. Nothing is looked up or guessed.

## One app-month (one app watched by hosted Parity for a month)

| line | per app-month (one app watched by hosted Parity for a month) |
| --- | ---: |
| Price | $29.00 |
| Meta credits: 2 re-captures per app-month, no code generation (estimate, see cfo-sources.md) | -$1.80 |
| Meta credits: diff explanations (estimate) | -$0.40 |
| Replay compute on a shared VM (estimate) | -$3.00 |
| Card fees, 2.9% + 0.30 (typical published processor rate) | -$1.14 |
| **Contribution** (what each app-month (one app watched by hosted Parity for a month) leaves to pay the fixed costs) | **$22.66** (78%) |

## The margin that matters

Fixed costs: $46 a month (Cloud VM for the hosted runner (estimate) $40, Domain and email (estimate) $6, Founder salary $0).

- **Break-even: 3 app-month (one app watched by hosted Parity for a month)s a day.** Below that you lose money every month.
- **Profit margin at your plan** (40 a day): **74%** of every sale, after every cost.

## Year 1, month by month

| month | app-month (one app watched by hosted Parity for a month)s a day | revenue | profit | cumulative (after $15 startup) |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 0 | $0 | -$46 | -$61 |
| 2 | 0 | $0 | -$46 | -$107 |
| 3 | 2 | $58 | -$1 | -$108 |
| 4 | 4 | $116 | $45 | -$63 |
| 5 | 7 | $203 | $113 | $50 |
| 6 | 10 | $290 | $181 | $230 |
| 7 | 14 | $406 | $271 | $501 |
| 8 | 18 | $522 | $362 | $863 |
| 9 | 23 | $667 | $475 | $1,338 |
| 10 | 28 | $812 | $588 | $1,927 |
| 11 | 34 | $986 | $724 | $2,651 |
| 12 | 40 | $1,160 | $860 | $3,512 |

- **Year 1 operating profit: $3,527** on $5,220 of revenue.
- After the $15 startup spend: $3,512.
- Startup money earned back: month 5.
- Cash you need before it pays for itself: **$108**.

## What if

| scenario | margin at plan | break-even a day | year 1 profit |
| --- | ---: | ---: | ---: |
| Base plan | 74% | 3 | $3,527 |
| Price -10% | 71% | 3 | $3,005 |
| Volume -20% | 73% | 3 | $2,711 |
| Unit costs +15% | 71% | 3 | $3,356 |

No red flags in these numbers. They are only as good as the inputs: check every cost against a real quote.
