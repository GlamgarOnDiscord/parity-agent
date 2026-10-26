# Launch: Parity

The launch is the hackathon submission on **Nov 4, 2026** (official deadline 21:00 ET = Nov 5, 03:00 Paris; internal deadline Nov 4, 20:00 Paris). Building may start Oct 27, 00:00 ET (05:00 Paris).

## Step 1: the cheapest real test, before the build

Free open-source product, so the test is attention and trial, not money.

- **Test:** on Oct 27, post the one-cent story on X ("every line looks right, the total is off by a cent; I am building the tool that catches this, follow along") with a link to the public repo (README with the problem and a "watch" button). Ask one question: "Would you run this on your app?"
- **Success line, written before:** by Oct 31, at least 25 people star or watch the repo or reply that they would try it, and at least 3 describe an app of their own it should work on.
- **Compare with the panel:** the panel says 40 % would try it after the full README. If real interest is far below, the problem is reach or the hook, not the product: rewrite the hook ([marketing.md](marketing.md)) before building more features.

## Step 2: the countdown (owner: the founder, for every task)

| days | dates | build | brand and marketing | critical path |
|---|---|---|---|---|
| 1 | Oct 27 | field model and matching across two UIs; capture of VS3 recording | day-1 post, cheapest test | **yes** |
| 2 | Oct 28 | deterministic replay and diff on VS3; volatile-field masking | one-cent post | **yes** |
| 3 | Oct 29 | rule extraction and review UI; **freeze the cut list** | SAM clip | **yes** |
| 4 | Oct 30 | Muse Code rebuild of the invoice screen; repair loop | rule clip | **yes** |
| 5 | Oct 31 | coverage map; send log (local by default); Playwright export | replay clip | no |
| 6 | Nov 1 | FrontAccounting as second app; noise measured | noise clip | no |
| 7 | Nov 2 | one-page proof report; README with real numbers; licence | code pushed | **yes** |
| 8 | Nov 3 | polish the two screens that matter (rules, diff); record the video | 45-second loop | **yes** |
| 9 | Nov 4 | buffer; submit by 20:00 Paris | submission thread | **yes** |

Cut first if a day slips: autonomous exploration, then FrontAccounting, then Playwright export. Never cut: matching, replay, masking, the one-cent catch, the report.

No legal registration, bank account, permits or hiring are needed for a free open-source project. Licence choice is on day 7.

## Step 3: launch day run sheet (Nov 4, Paris time)

| time | what |
|---|---|
| 09:00 | Fresh clone on a clean folder; run the README steps exactly; fix anything that fails |
| 11:00 | Final video exported (3:00 max); uploaded |
| 12:00 | Submission form filled with links; video link checked in a private window |
| 14:00 | README final: numbers from the real runs only, licence, demo GIF |
| 16:00 | Submit (well before the internal deadline) |
| 17:00 | X thread: the story, the clip, the repo, the ask to vote |
| 18:00 to 20:00 | Reply to every comment; fix only critical README issues |
| If something breaks | Video upload fails: use the backup host link. Demo app breaks: the video is the proof; do not re-record after 18:00. |

## Step 4: the first 30 days (Nov 5 to Dec 4)

- **Weekly numbers:** stars and clones; strangers who ran it on their own app; X views on the thread.
- **Triggers:** under 50 stars by Nov 11, rewrite the README hero; zero strangers running it by Nov 20, offer to run it for three people on their app; any issue about noise, fix before anything else.
- **Reviews:**
  - Day 7: Did the Show HN go out? What did commenters doubt?
  - Day 14: How many real apps has it run on? What broke first?
  - Day 30: Does anyone want the hosted Team tier or a migration report enough to pay? If 3 say yes with a price, start the paid test in [pricing.md](pricing.md).
