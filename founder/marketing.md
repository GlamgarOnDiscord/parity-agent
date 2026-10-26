# Marketing: Parity

Evidence: [panel v2](panel/results.md) (40 % try it), [competitors](competitors.md), [offer](offer.md), [pricing](pricing.md). Product is free, so "customers" are people who install it and run it on their own app; for the hackathon, also judges and the people who vote.

## Positioning

1. **For developers and IT consultants who ship changes they cannot fully check** (AI-agent pull requests, legacy migrations), who have seen "tests passed, invoice wrong", Parity is the open-source behavior proof that replays your app before and after and shows every field that changed, offline, unlike API replay tools that need an SDK and stop at the API layer.
2. For the people who rebuild old business apps, Parity is the readable proof that the new app does what the old one did, unlike mainframe-only equivalence vendors and manual parallel runs.
3. For anyone merging AI-written code, Parity is the second opinion that never uses AI to decide what changed.

**Recommended: 1.** It names the two segments that moved most on the re-test (IT consultants 0 → 50 %, freelancers 0 → 50 %, team developers 29 → 43 %) and the claim that flipped AI skeptics (0 → 75 %): the comparison is plain code. Version 2 is the hackathon demo story; version 3 is the hook for X.

Watch out: Keploy's headline is already "AI writes code. Keploy catches what breaks" ([competitors.md](competitors.md)). Never lead with "catches what AI breaks" alone; lead with **any app, end to end, offline, readable**.

## Channels (pick three)

| channel | why it fits | cost | how we know it worked |
|---|---|---|---|
| **GitHub README with a 60-second demo** | every panel "yes" came from a README showing a real bug caught | founder time | stars, clones, issues opened by strangers |
| **X, short demo clips** | Most Viral prize (20k USD) is judged on X; devs share "tests passed, bug shipped" stories | founder time | views, reposts, quote posts by developers |
| **Hacker News (Show HN), after submission** | the audience that wrote the competitor complaints (noise, lock-in, PII) | founder time | front page, comments asking to try it |
| Not now: Reddit (blocked during research, rules vary per sub), paid ads (no budget), LinkedIn (wrong audience for a CLI) | | | |

## The calendar (hackathon is the launch: building starts Oct 27, submission Nov 4)

| date | channel | what goes out |
|---|---|---|
| Oct 27 | X | "Day 1 of 9: building a tool that proves a rebuilt app does exactly what the old one did. Here is the old Windows app it starts from." Screenshot of Virtual Salesman 3 |
| Oct 28 | X | The one-cent bug, found by hand: legacy 69.21, naive rebuild 69.22. "Every line looks right. The total is off." |
| Oct 29 | X | First capture running: SAM 3.1 masks over the old app (short clip) |
| Oct 30 | X | The rule list in plain language, one rule accepted with a click |
| Oct 31 | X | First deterministic replay: two apps side by side, fields diffed |
| Nov 1 | X | Noise control: timestamps masked on the first run, before and after |
| Nov 2 | X, GitHub | Code and README pushed to the public repo; FrontAccounting second example |
| Nov 3 | X | The full loop in 45 seconds |
| Nov 4 | X, GitHub, Devpost | Submission: 3-minute video, README final, thread with the story |
| Nov 5-6 | HN | Show HN: "Parity: replay your app before and after a change, diff every field, offline" |
| Nov 7-20 | X, GitHub | One post per issue fixed from a stranger's app; "what it caught this week" |

When there is nothing new: the making of (the Wine sandbox at 165 MB, the credit budget), and the rules found in old software.

## Ten hooks (each answers a panel objection or reason)

1. "Every test passed. The invoice was one cent wrong." (reason to buy, P001, P020)
2. "The AI never decides what 'the same' means. The comparison is plain code." (trust, P012, P016)
3. "Nothing leaves your machine unless you send it." (data, P002, P013, P015)
4. "Timestamps and ids masked on the first run. No wall of false diffs." (noise, P006, P020)
5. "Your proof exports as plain Playwright tests. Keep them even if you stop using Parity." (lock-in, P010, P019)
6. "It rebuilt a 2000s Windows sales app and proved it, field by field." (demo)
7. "Not a toy demo: here it is on FrontAccounting, an app I did not write." (toy demos, P002, P018)
8. "A coverage map shows what was NOT tested." (false confidence, P012, P019)
9. "One command for web apps." (setup time, P004, P013)
10. "Your IT provider can hand you a one-page proof before you sign off." (owners, P003, P014)

## Budget and numbers

- Budget: $0 cash; founder time; Meta credits stay for the product ([cfo.md](cfo.md)).
- Most you can pay to win a user: $0 now (free). In the hosted scenario, each app-month leaves $22.66; a user who stays 12 months is worth about $272, so acquisition must stay well under that.
- Three numbers to watch weekly: GitHub stars and clones (change something if under 50 stars by Nov 11), strangers who report running it on their own app (target 10 by Nov 20), X views on the submission thread (under 5k means rewrite the hook, not more posts).

Rules: no fake numbers or testimonials; panel quotes are research, never used as user quotes.
