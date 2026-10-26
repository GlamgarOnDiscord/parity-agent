# Parity (working name; public repo `parity-agent`) · Business plan

**Verdict: Profitable**

- ✓ Each app-month (one app watched by hosted Parity for a month) earns $22.66 before fixed costs (78% contribution).
- ✓ Year 1 operating profit: $3,527.
- ✓ 8 of 20 simulated buyers buy (40%, the bar is 25%).

| key number | |
| --- | ---: |
| Price | $29.00 a app-month (one app watched by hosted Parity for a month) |
| Profit margin at plan | 74% per app-month (one app watched by hosted Parity for a month) |
| Break-even | 3 app-month (one app watched by hosted Parity for a month)s a day |
| Year 1 operating profit | $3,527 |
| Startup spend | $15 |
| Cash needed before it pays for itself | $108 |
| Startup money earned back | month 5 |
| Buyer panel | 8 buy · 12 pass |

## The idea

- What it is: an agent that records how a piece of software behaves (screens, inputs, outputs, business rules) and turns that recording into a replayable proof, so any change to the software (a legacy rewrite, a refactor by an AI coding agent, a framework or OS upgrade) can be checked against it: same inputs, same results, every difference shown and explained.
- Who it is for: as many people as possible. Developers and teams who change software they did not write or cannot fully read (AI agents, migrations, upgrades); IT service providers who rebuild old business apps; non-technical owners of an old app who need to know the new one does the same thing.
- What it sells, at what price: free for now. Open-source tool; no paid tier decided.
- Where and how: online, open source on GitHub. Runs locally or in a sandbox (Docker, Wine for old Windows apps, a browser for web apps); uses Meta's AI models through the Meta Model API. Found through GitHub, developer communities and the hackathon.
- Budget and constraints: one developer (a BTS SIO student, France), building solo during a nine-day AI hackathon, Oct 27 to Nov 4, 2026. 150 USD of Meta API credits; low RAM and disk on one laptop. Must use Meta models (Muse Spark, SAM 3.1, Muse Voice Transcribe, Muse Code, Muse Wonder, Muse Spark Open on Baseten). Only work built during the hackathon may be shown; the submission is a public repo and a 3-minute video. Judging: impact 30 %, use of Meta tooling 25 %, technical depth 20 %, demo 25 %.

## Summary

**What it is.** Parity Proof records how an app behaves and replays it before and after any change, showing every field that moved with its evidence, offline. First for developers and IT consultants who ship changes they cannot fully check: AI-agent pull requests and legacy rebuilds. Free and open source, built for the Meta hackathon (Oct 27 to Nov 4, 2026).

**Verdict: Profitable, computed by `compile.py`, and it needs two caveats.** It applies to a *scenario*, a hosted Team tier at $29 per app per month that does not exist and is not planned for the hackathon. The panel's "buys" are free trials, not payments. The three numbers: 78 % contribution per app-month, break-even at 3 paying apps a month, year 1 operating profit $3,527 with the founder paid $0. Read it as "the economics would not be the problem"; demand is unproven.

**Board and panel.**
- They agree on what wins trust: deterministic comparison, local by default and proof on a real bug. The offer built on that moved the panel from 15 % to 40 %, and AI skeptics from 0 of 4 to 3 of 4.
- They disagree on breadth. The board wants one buyer: legacy rebuilds for IT providers. The panel's best rates were IT consultants and freelancers (50 %) and team developers (43 %), so a developer-first pitch with the legacy rebuild as the demo fits both.
- Nobody adopts among people who need approval, firefighters or non-technical owners. They need someone else to run it and someone to stand behind it.

**Biggest risk.** Noise. False differences from timestamps and changing data are the top complaint against every competitor (17 data points), and the main reason panel buyers say they would uninstall after one run. The plan: masking volatile fields comes right after field matching, and noise is measured on two apps, one the founder did not write.

**Second risk.** Keploy (open source, 18.8k stars) already says "AI writes code. Keploy catches what breaks". Parity's ground is any app, end to end, offline, with a proof a non-developer can read.

**What the founder needs.**
- Cash: none. The real budget is the $150 of Meta credits: about 23 full runs or 122 captures. Code generation is 80 % of it.
- First test: post the one-cent story on Oct 27 and aim for 25 people watching or saying they would try it by Oct 31.

**The one thing to do this week.** Design and test field matching between the old Windows screen and the new web screen on day 1. Every other part of the proof depends on it.

_The panel is simulated buyers and the numbers are projections; real users and real quotes confirm them. Not financial, legal or tax advice._

## What the board said

**Vote: 3 fund if, 0 fund, 0 pass. Average score 5.0 / 10** (Offers 6, Monopoly 4, Product 5).

Memos: [offers](board/offers.md), [monopoly](board/monopoly.md), [product](board/product.md).

### Risks raised by more than one member

1. **No focus (all three).** "Any change to any software, for as many people as possible" is three products for three buyers (developers with AI agents, IT service providers, non-technical owners), each with a different pain, first five minutes and way to be reached. It weakens the impact score and leaves no small market to own first.
2. **Nothing is built and the pipeline is long (all three).** About eight handoffs (video, transcription, segmentation, autonomous exploration, rule extraction, validation, replay, diff) on one laptop in 9 days. If the demo cannot catch a real difference end to end, the offer has no proof and the video shows a diagram.
3. **The buyer does a lot of work (Offers, Product).** Recording, narrating, waiting for exploration, then validating every rule before getting any value. Validation time and the extraction error rate are unknown.
4. **Durability and distribution (Monopoly; Offers on who pays).** Free, open source, built on model capabilities that every provider is improving. No channel for the first 100 users, no moat yet.

Where they disagree: the Monopoly lens rates the engineering itself (behavior captured from a binary with no source, replayed deterministically) as a step change; the Product lens trusts least the field matching between an old Windows UI and a new web UI. Both are right: that matching step is where the technical depth is and where it can fail.

### Conditions (checklist for the rest of the pack)

- [ ] Pitch one buyer and one job: an IT service provider (or the owner) rebuilding a legacy business app, with proof it behaves the same. "Any change to any software" becomes one closing line about where it goes next.
- [ ] One scenario end to end, live, on Virtual Salesman 3: the one-cent tax-on-tax difference caught, explained and backed by evidence on screen.
- [ ] Field matching across two different UIs designed and tested first (by label, value or explicit mapping), since the proof depends on it.
- [ ] A cut list frozen by day 3: autonomous exploration and FrontAccounting are optional and dropped if they risk the main path.
- [ ] Expert validation shown as a few timed clicks; measure how many of the 15 hand-observed rules the pipeline extracts and how many it gets wrong.
- [ ] The guarantee in one sentence with a name, e.g. "every field matches, or every difference is shown with evidence".
- [ ] The rule-review and diff screens get the craft; everything else stays plain.
- [ ] After the hackathon: name one segment, talk to 10 buyers in it, pick one channel with a cost per user.
- [ ] Choose a moat to build: an open, versioned proof format plus a shared corpus of validated rules, so each proof makes the next capture cheaper.
- [ ] Open questions for other skills: who loses money when parity breaks and how much; what someone would pay later and who pays (competitors, consumer panel).

### The strongest version the board can see

It is narrower than the pitch. Parity proves that a rebuilt legacy business app does exactly what the old one did, field by field, starting with the people who do these migrations (IT service providers) and the owners who must sign them off. The demo is one real cent caught on a real old Windows app. The wider promise, a proof that any software still behaves the same after any change, including changes written by AI agents, is the expansion path. What would make it durable is not the AI but the accumulated asset: an open proof format and a growing library of validated business rules. That is where "help everyone" comes from in the long run: from a commons that each migration enriches, not from a broad pitch on day one.

## The competition

Full facts and links: `competitors.csv`. G2, Capterra and GetApp returned 403 and Reddit could not be fetched, so ratings are GitHub stars only and the complaints come from GitHub issues and Hacker News.

### 1. Competitors, most direct first

| # | Name | Type | Small-team price | What it compares |
|---|---|---|---|---|
| 1 | [Mechanical Orchard Imogen](https://www.mechanical-orchard.com/platform) | direct | not public | Mainframe rewrite against captured data flows |
| 2 | [AWS Transform for mainframe](https://aws.amazon.com/blogs/aws/aws-transform-for-mainframe-introduces-reimagine-capabilities-and-automated-testing-functionality/) | direct | agent [free](https://aws.amazon.com/transform/pricing/) | z/OS batch output, old vs new |
| 3 | [Tusk Drift](https://usetusk.ai) | direct | [$50/dev/mo](https://usetusk.ai/pricing) | Production API traces replayed on PRs |
| 4 | [Keploy](https://keploy.io) | direct | [$19/user/mo](https://keploy.io/pricing), OSS free | API traffic to tests and mocks |
| 5 | [Speedscale](https://speedscale.com) | direct | [not public](https://speedscale.com/pricing/) | Traffic replay against a change |
| 6 | [Meticulous](https://www.meticulous.ai) | direct | not public | Recorded JS-frontend sessions, visual diff |
| 7 | [GoReplay](https://github.com/buger/goreplay) | direct | [$2,950/yr PRO](https://goreplay.org/pro/), OSS free | Live HTTP shadowing |
| 8 | [Qodo](https://www.qodo.ai/pricing/) | indirect | $30 + credits | AI review and test generation |
| 9 | [Chromatic](https://www.chromatic.com/pricing) | indirect | $179/mo | Visual snapshots |
| 10 | [Playwright codegen](https://github.com/microsoft/playwright) | indirect | free | Recorded browser scripts |
| - | Hand-written tests ([ApprovalTests](https://github.com/approvals/ApprovalTests.Java)), [parallel run, manual QA](https://www.fullstack.com/blog/how-ai-is-transforming-legacy-modernization), doing nothing | substitutes | staff time | - |

### 2. Price range (published small-team plans; units differ)

- Lowest: **$0**. Keploy, GoReplay and Playwright have free open-source versions, and AWS lists its mainframe modernization agent as free. Runtime costs $0.31 per CPU core per hour ([AWS](https://aws.amazon.com/mainframe-modernization/pricing)).
- Median of the five paid entry plans ($19, $30, $50, $179, ~$246/mo): **$50/month**.
- Highest published: **GoReplay PRO at $2,950/year**.
- Not public: Mechanical Orchard, Meticulous and Speedscale Pro. These are the enterprise end, and their real ceiling is unknown.

### 3. Positioning map

```
                 PROVES END-TO-END BUSINESS BEHAVIOR
                               |
   Meticulous (JS UI only)     |   Mechanical Orchard, AWS Transform
   Playwright, Chromatic (UI)  |   (mainframe only, sold to execs,
                               |    run by engineers)
DEVS ONLY ---------------------+--------------------- ANYONE
   Keploy, Tusk, Speedscale,   |   Manual QA, parallel run
   GoReplay (API layer)        |   (substitutes; slow, costly)
   Qodo, ApprovalTests (code)  |   [EMPTY: any app, readable proof]
                               |
                     PROVES CODE / API LEVEL
```

### 4. Complaints, ranked

1. **Noise: false diffs from dynamic or non-deterministic data (17).** There are 11 Keploy issues, for example [#3299](https://github.com/keploy/keploy/issues/3299) "testsets failing because of noisy fields" and #4349 "ordering of elements in an array is treated as a failure" ([bug list](https://github.com/keploy/keploy/issues?q=is%3Aissue+is%3Aopen+label%3Abug)). The other 6 are Hacker News comments on [Tusk](https://news.ycombinator.com/item?id=45887536) and [Meticulous](https://news.ycombinator.com/item?id=31236066): "there are fundamental issues with anything that doesn't reproduce timing perfectly" (inglor).
2. **Narrow stack coverage (10).** Tusk at launch: "Currently only supports Node backends", and "Drift is language specific" ([HN](https://news.ycombinator.com/item?id=45887536)). Meticulous: "without a WS support, not all projects could benefit" ([HN](https://news.ycombinator.com/item?id=31236066)). GoReplay has open requests for TCP, Kafka, SIP and audio ([issues](https://github.com/buger/goreplay/issues)), and Keploy cannot record MySQL cursor fetch (#4261).
3. **Recording misses traffic (8).** Seven GoReplay issues report missed or truncated captures, among them #1247, #1252 and #1269 ([issues](https://github.com/buger/goreplay/issues)). Keploy's recorder can break long-lived HTTP responses (#3997).
4. **Baselines go stale (3).** The Tusk founder: "you'd need to manually re-record traces" ([HN](https://news.ycombinator.com/item?id=45887536)). Keploy has stale mocks in #4488 and #4021.
5. **PII ends up in recordings (3).** "session recording will inevitably slurp up PII" ([HN](https://news.ycombinator.com/item?id=31236066)). Tusk: "no default mode for this at the moment" ([HN](https://news.ycombinator.com/item?id=45887536)).
6. **Lock-in to closed tools (3, all from one 2022 thread).** "very concerned about building up a large suite of tests ... on proprietary tech" ([HN](https://news.ycombinator.com/item?id=31236066)).
7. **"Passing" is not proof (3).** Diffblue's generated tests "passed since Cover did not know the intent of the code" ([The Register, 2020](https://www.theregister.com/2020/09/21/diffblue_let_ai_code_unit_tests)). AWS's validation tools "are control points, not proof" ([SoftwareReviews, 2026](https://www.softwarereviews.com/vendor-technology-notes/aws-transform-says-it-s-processed-10-billion-lines-of-legacy-code)).
8. **Price (1, thin).** "too scaled back to get good use out of it" ([HN](https://news.ycombinator.com/item?id=31236066)).

### 5. The gap

None of the tools found covers both halves of this: **proving that an arbitrary app (old Windows desktop, legacy web, CLI) behaves the same end to end, and producing a proof a non-developer can read.**

- The players that prove equivalence are mainframe-only ([Imogen](https://www.mechanical-orchard.com/platform); AWS covers "IBM z/OS mainframe batch").
- The open tools are tied to a stack: an SDK for Node or Python, eBPF on the API layer, or JS frontends. They output developer artifacts such as mocks and PR checks (complaint 2).
- Buyers are told to "Require an independent acceptance gate" ([SoftwareReviews](https://www.softwarereviews.com/vendor-technology-notes/aws-transform-says-it-s-processed-10-billion-lines-of-legacy-code)). Today that gate is manual QA or a parallel run.

Caveats:
- Demand from non-technical owners is a **hypothesis**. No source found shows them looking for such a tool.
- Noise is complaint #1 and the hardest problem in this category. "Every difference shown and explained" walks straight into it. If an LLM cannot reliably separate noise from a real regression, Parity inherits the top complaint.

### 6. The threat

- **Keploy, fastest.** It is Apache-2.0 with 18.8k stars, and its headline is already "AI writes code. Keploy catches what breaks". It has the record and replay engine. Adding a browser or desktop recorder plus LLM-written diff explanations is an extension, not a new product.
- **Meticulous.** It reportedly raised $15M in July 2026 and plans to move to full stack ([Dealroom](https://app.dealroom.co/news/note/meticulous-raises-15m-to-test-ai-generated-code-before-it-ships)). Unverified.
- **AWS.** It already gives away equivalence-testing tooling inside a free mainframe agent. If it extends that to Windows or .NET migrations (it already has a Windows agent, [pricing](https://aws.amazon.com/transform/pricing/)), the enterprise end becomes free and bundled.
- **Name.** "Parity" is a generic term in this field. Thoughtworks teaches "black-box parity" testing ([O'Reilly](https://www.oreilly.com/live-events/migrating-spec-less-code-with-ai-and-parity/0642572401733/0642572401726/)), so the name will be hard to find in search.

## The buyer panel

**8 buy · 12 pass** (40% buy) out of 20 simulated buyers. Seed 26, so the same cards can be dealt again.

These are simulated buyers, not customers. Use this to find objections and weak spots, then confirm the big ones with real people before you spend.

### By segment

| group | buyers | buy rate |
| --- | ---: | ---: |
| Consultant at an IT services firm doing legacy migrations | 4 | 50%  (thin) |
| Solo developer or freelancer maintaining client apps | 4 | 50%  (thin) |
| Developer in a product team that uses AI coding agents daily | 7 | 43%  (thin) |
| Owner or office manager of a small business running an old Windows app | 3 | 33%  (thin) |
| IT staff in a public body (city, hospital, school district) | 2 | 0%  (thin) |

### By buying behaviour

| group | buyers | buy rate |
| --- | ---: | ---: |
| Tries new GitHub tools | 4 | 100%  (thin) |
| Skeptical of AI tools | 4 | 75%  (thin) |
| Already has a test suite | 3 | 33%  (thin) |
| Needs approval to adopt | 3 | 0%  (thin) |
| Firefighter with no time | 3 | 0%  (thin) |
| Non-technical, relies on a provider | 3 | 0%  (thin) |

### By income

| group | buyers | buy rate |
| --- | ---: | ---: |
| $112,000 and up | 7 | 57%  (thin) |
| under $62,000 | 6 | 50%  (thin) |
| $62,000 to $112,000 | 7 | 14%  (thin) |

### Why they pass

| reason | buyers | in their words |
| --- | ---: | --- |
| convenience | 6 | "Free is nice, but recording scenarios and standing up a Windows sandbox for our old app is not an under-an-hour job, and nobody is changing that app this month anyway. I'd star it on GitHub and forget it." (P003) · "I do merge AI-written PRs and it does make me nervous, but I'm putting out fires all week and recording every scenario of our apps is a project, not a one-hour install. I'd star the repo and never get back to it." (P004) |
| trust | 4 | "The idea matches my job, but a one-cent invoice demo is exactly the toy case I distrust, and I can't put a new tool on a client's legacy migration without security and my manager signing off. Free doesn't help with that, the approval is the cost, and I won't start it for something I haven't seen work on a messy real app." (P002) · "The one-cent invoice catch is exactly what keeps me up after merging AI pull requests, but I can't put a free student project on the machine that runs our billing app and then defend it to whoever signs off. If it's abandoned next year, I'm the one explaining why our checks depend on it." (P005) |
| habit | 2 | "We already have unit tests, Playwright end-to-end tests and CI gating every AI pull request, and nothing has slipped through badly enough to make me add another tool. Being free doesn't change that: setting up recordings and keeping them current costs time I'd rather spend writing the tests directly." (P007) · "We already have unit tests, end-to-end tests and CI, and nothing has slipped through badly enough to make me add another tool. Recording scenarios and triaging diffs sounds like more work than writing the missing test, especially when I'm finally starting a migration I've put off for a year and don't want new moving parts." (P008) |

### Why they buy

| reason | buyers | in their words |
| --- | ---: | --- |
| need | 7 | "I merged three AI-written PRs this week and only trusted them because CI was green, and the one-cent invoice bug that got past passing tests is exactly the kind of thing that scares me. It's free and a single command, so I'll install it on a weekend and point it at the old app." (P001) · "I merged three agent-written PRs this week and only trusted them because the tests were green, so the one-cent invoice bug the tests missed is exactly what scares me. It's free, one command, and I keep the Playwright tests, so I'll try it on one app this week." (P006) |
| timing | 1 | "I'm about to start the migration I've been dodging for a year, and it's free and runs offline, so one afternoon pointing it at a client app before and after costs me nothing but time. If it shows me a diff my tests missed, it stays; if it buries me in noise, it's gone the same day." (P011) |

### What would flip a no

- A credible case study or a quick run on one of our own legacy apps, done in an afternoon, that catches a real regression, plus a written statement I can hand to security showing it runs fully offline with the AI turned off.
- Our IT provider telling me they're replacing or upgrading the app and running this for me as part of the job.
- Seeing it catch a real regression on one of our own apps in under an hour, from one command, with no scenario-writing on my side.
- A company or a paid support plan behind it with a maintenance commitment, plus a short security write-up I could hand straight to the person who approves tools.
- An AI-written PR that passes our whole suite and still ships a real regression to production. After that I'd try it on that exact flow.
- Seeing it catch a real difference on our own app during the migration, within an hour of setup, that our existing suite missed.
- My provider or a client running it on my actual migration and handing me a short report showing it caught a real break that our tests missed.
- A fully offline mode with the AI parts switched off by default, plus proof it caught a real regression on a codebase like ours, so I can show my manager a concrete case instead of a README demo.
- A client upgrade landing on my desk, plus proof I can go from install to a first diff on a real app in under an hour with AI fully off by default.
- Our IT provider or a dev on my team setting it up and handing me a simple report I can show the client, or a hosted version where I just click through the app and get a plain yes/no per scenario.
- Our IT provider or platform team turning it on for us as a hosted or one-click thing, so I just open a report after the AI agent's change and see what differs.
- A year of steady commits and releases with more than one maintainer, plus a write-up from another public-sector or IT shop that ran it on a real legacy migration.

Buyers say they would buy **1.0 times** in the first month on average.

20 buyers gave all four price answers. Run founder-pricing's van_westendorp.py on the answers folder.

## Pricing

Curve: [pricing-curve.md](pricing-curve.md). Panel: [panel-v1/results.md](panel-v1/results.md).

### The price

**Free during and after the hackathon (founder's decision).** The core stays free and open source. Pricing applies only to a possible later version, so this document sets what to test then, not now.

### What buyers said (simulated, for a paid version)

- 12 of 20 answers usable (8 dropped: several buyers put "too cheap" at 0 because the product is free, which the method treats as out of order).
- Acceptable range **$9.33 to $98.50**, least resistance (OPP) **$26**, indifference (IPP) **$32.25**.
- No billing unit was given, so most buyers assumed a monthly price per person; one (P014, a non-technical owner) answered as a one-off service price: $150 bargain, $800 expensive. That split matters: developers price a tool, owners price a service.

### What competitors charge

Pending `founder/competitors.md` (the scout is still running). To be compared once it lands.

### What the business needs

No paid tier exists, so there is no margin to protect yet. The real cost today is Meta API credits per capture (see `founder/cfo.md`). Replays and diffs run without AI and cost nothing per run.

### Ladder to test later (not now)

| rung | for | what | test price |
|---|---|---|---|
| Open | everyone | CLI, local replays and diffs, open proof format, export to Playwright tests | free |
| Team | dev teams and freelancers | hosted runs on every pull request, shared rule library, history | $19 or $29 per app per month (around OPP) |
| Migration report | IT providers and owners | signed parity report for one migration, evidence pack, rule review session | one-off, test $490 vs $990 |

### Opening offer

None needed while free. Later: founding teams keep the Team price for a year, ending on a fixed date.

### What to test with real buyers (after the hackathon)

1. Team at $19 vs $29 per app per month, two landing pages, waitlist with a price shown.
2. Migration report at $490 vs $990, offered to three IT providers as paid pilots.

### Price objections, verbatim (top three)

- "Free doesn't help much when the real cost is my time in the middle of a migration I've already put off for a year." (P008)
- "Free costs me nothing, but my time and a production app don't." (P019)
- "Free and local gets it past procurement. It does not get it past me this month." (P012)

The lesson: price is not the barrier. Time to first result and trust are.

## The offer

Inputs: [idea](idea.md), [pitch v1](pitch-v1.md), [panel](panel-v1/results.md) (3 of 20 adopt, 15 %), [board](board.md), [pricing](pricing.md). Costs are effort and Meta credits, not money (see [cfo](cfo.md)).

### Problem list (buyer's words first, from the panel)

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

### Solutions, scored (value 1-5, cost to build in 9 days 1-5, 5 = expensive)

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

### The stack

- **Core: "Parity Proof".** Record your app once; get a replayable proof. After any change, Parity replays it on both versions and shows every field that differs, with evidence, offline.
- **Bonus 1: the one-cent demo.** Kills "toy demos" and "my tests already do this".
- **Bonus 2: keep your tests.** Playwright export plus open proof format. Kills "who maintains it" and lock-in.
- **Bonus 3: the owner's report.** One page, signed. Kills "whoever migrates should prove it".
- **Guarantee: "Every field matches, or every difference is shown with its evidence. Nothing leaves your machine unless you send it."** Cost: zero money; it is a design commitment, testable in the demo.
- **Urgency:** none faked. The only real date is the hackathon submission.
- **Name:** Parity Proof.

### Value equation (1-10, before, after)

| element | before | after | moved by |
|---|---:|---:|---|
| dream outcome | 7 | 8 | owner's report (someone can sign) |
| likelihood | 2 | 6 | deterministic diff, coverage map, the real one-cent demo |
| time to result | 4 | 6 | one command for web apps |
| effort and sacrifice | 3 | 6 | local by default, noise control, Playwright export |

### Re-test

Pitch v2 in [pitch.md](pitch.md) (v1 kept as [pitch-v1.md](pitch-v1.md)), same 20 cards (seed 26) in `founder/panel/`. Result: see the section below once the panel finishes.

### Re-test result (same 20 cards, seed 26)

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

## The numbers

Parity is free today, so there is no margin yet. This file has two parts: what the hackathon really costs (Meta credits), and a scenario for a later hosted tier, run through the CFO tool. The scenario is not the plan.

### 1. The hackathon budget: $150 of Meta credits

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

### 2. Scenario: a hosted Team tier after the hackathon ($29 per app per month)

- **Margin:** each app-month leaves **$22.66 (78%)** after model calls, replay compute and card fees; at 40 apps a month the margin is **74%**.
- **Break-even:** 3 paying apps a month cover the $46 of fixed costs.
- **Cash needed:** **$108** before it pays for itself; earned back in month 5.
- **The line that matters most is not in the table:** the founder's time is costed at $0. Year 1 operating profit of $3,527 is pocket money, not a salary. Volume, not margin, is the problem.
- **Three ways to improve it:** price at the panel's indifference point ($32.25) instead of $29 (about +$390 in year 1 at the same volume); sell the one-off migration report ($490 to $990) to IT providers, where one sale equals 17 to 34 app-months; cut replay compute by running replays on the customer's own machine (the variable cost drops from $6.34 to about $3.34).
- **Board conditions about money:** none of them were about money; they were about focus and proof. Met by this note: none. This is not financial, tax or legal advice; an accountant checks the structure before any money moves.

---

## Unit economics: Parity, SCENARIO ONLY: a possible hosted Team tier after the hackathon (the product is free today)

Every number below comes from the input file. Nothing is looked up or guessed.

### One app-month (one app watched by hosted Parity for a month)

| line | per app-month (one app watched by hosted Parity for a month) |
| --- | ---: |
| Price | $29.00 |
| Meta credits: 2 re-captures per app-month, no code generation (estimate, see cfo-sources.md) | -$1.80 |
| Meta credits: diff explanations (estimate) | -$0.40 |
| Replay compute on a shared VM (estimate) | -$3.00 |
| Card fees, 2.9% + 0.30 (typical published processor rate) | -$1.14 |
| **Contribution** (what each app-month (one app watched by hosted Parity for a month) leaves to pay the fixed costs) | **$22.66** (78%) |

### The margin that matters

Fixed costs: $46 a month (Cloud VM for the hosted runner (estimate) $40, Domain and email (estimate) $6, Founder salary $0).

- **Break-even: 3 app-month (one app watched by hosted Parity for a month)s a day.** Below that you lose money every month.
- **Profit margin at your plan** (40 a day): **74%** of every sale, after every cost.

### Year 1, month by month

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

### What if

| scenario | margin at plan | break-even a day | year 1 profit |
| --- | ---: | ---: | ---: |
| Base plan | 74% | 3 | $3,527 |
| Price -10% | 71% | 3 | $3,005 |
| Volume -20% | 73% | 3 | $2,711 |
| Unit costs +15% | 71% | 3 | $3,356 |

No red flags in these numbers. They are only as good as the inputs: check every cost against a real quote.

## Marketing

Evidence: [panel v2](panel/results.md) (40 % try it), [competitors](competitors.md), [offer](offer.md), [pricing](pricing.md). Product is free, so "customers" are people who install it and run it on their own app; for the hackathon, also judges and the people who vote.

### Positioning

1. **For developers and IT consultants who ship changes they cannot fully check** (AI-agent pull requests, legacy migrations), who have seen "tests passed, invoice wrong", Parity is the open-source behavior proof that replays your app before and after and shows every field that changed, offline, unlike API replay tools that need an SDK and stop at the API layer.
2. For the people who rebuild old business apps, Parity is the readable proof that the new app does what the old one did, unlike mainframe-only equivalence vendors and manual parallel runs.
3. For anyone merging AI-written code, Parity is the second opinion that never uses AI to decide what changed.

**Recommended: 1.** It names the two segments that moved most on the re-test (IT consultants 0 → 50 %, freelancers 0 → 50 %, team developers 29 → 43 %) and the claim that flipped AI skeptics (0 → 75 %): the comparison is plain code. Version 2 is the hackathon demo story; version 3 is the hook for X.

Watch out: Keploy's headline is already "AI writes code. Keploy catches what breaks" ([competitors.md](competitors.md)). Never lead with "catches what AI breaks" alone; lead with **any app, end to end, offline, readable**.

### Channels (pick three)

| channel | why it fits | cost | how we know it worked |
|---|---|---|---|
| **GitHub README with a 60-second demo** | every panel "yes" came from a README showing a real bug caught | founder time | stars, clones, issues opened by strangers |
| **X, short demo clips** | Most Viral prize is judged on X; devs share "tests passed, bug shipped" stories | founder time | views, reposts, quote posts by developers |
| **Hacker News (Show HN), after submission** | the audience that wrote the competitor complaints (noise, lock-in, PII) | founder time | front page, comments asking to try it |
| Not now: Reddit (blocked during research, rules vary per sub), paid ads (no budget), LinkedIn (wrong audience for a CLI) | | | |

### The calendar (hackathon is the launch: building starts Oct 27, submission Nov 4)

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

### Ten hooks (each answers a panel objection or reason)

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

### Budget and numbers

- Budget: $0 cash; founder time; Meta credits stay for the product ([cfo.md](cfo.md)).
- Most you can pay to win a user: $0 now (free). In the hosted scenario, each app-month leaves $22.66; a user who stays 12 months is worth about $272, so acquisition must stay well under that.
- Three numbers to watch weekly: GitHub stars and clones (change something if under 50 stars by Nov 11), strangers who report running it on their own app (target 10 by Nov 20), X views on the submission thread (under 5k means rewrite the hook, not more posts).

Rules: no fake numbers or testimonials; panel quotes are research, never used as user quotes.

## Brand

Inputs: [marketing](marketing.md) (positioning 1), [competitors](competitors.md), [panel v2](panel/results.md). Existing identity in the private repo (`brand/`, `DESIGN.md`): the P with a detached pixel, Geist, near-black and blue.

### Name candidates

| # | name | style | says | out loud, on an icon | risk |
|---|---|---|---|---|---|
| 1 | Parity | descriptive | same behavior | short, strong; the logo exists | generic in this field ("black-box parity", Thoughtworks); Parity Technologies (blockchain) owns the strong association; hard to search |
| 2 | **Parity Proof** | descriptive | the proof, not just the idea | clear; "PP" weak as a monogram, keep the P | longer; still shares "Parity" |
| 3 | **Twinproof** | invented | old and new twins, proven | memorable, one word | GitHub handle `twinproof` taken |
| 4 | **Legacy Twin** | descriptive | a twin of your legacy app | explains the demo instantly | narrows to legacy, misses the AI-change use |
| 5 | Samewise | invented | wise about "the same" | playful | sounds like a pun, weak for security buyers |
| 6 | Unchanged | descriptive | nothing changed | plain | generic word, unsearchable |
| 7 | Witness | evocative | it saw how the app behaved | strong story | crowded word in software |
| 8 | Ledgerline | evocative | money fields line up | good for accounting demo | too finance-specific |
| 9 | Replay Proof | descriptive | how it works | clear | sounds like a feature, not a product |
| 10 | Tom's name | founder | - | - | no; the panel wants an institution, not a person |

**Shortlist: Parity Proof (recommended), Twinproof, Legacy Twin.** Parity Proof keeps the existing logo, the public repo `parity-agent` and everything already designed, and the word "Proof" carries the guarantee. If the trademark search on "Parity" in software classes comes back crowded, switch to Twinproof before any paid tier.

### Checks (public lookups on 2026-10-26; the founder confirms)

| check | Parity Proof | Twinproof | Legacy Twin |
|---|---|---|---|
| .dev domain (Google registry RDAP) | `parityproof.dev` not registered | `twinproof.dev` not registered | `legacytwin.dev` not registered |
| .com domain | not checked (registry lookup timed out) | not checked | not checked |
| GitHub handle | `parityproof` free | `twinproof` taken | not checked |
| X, Instagram, YouTube | not checked: needs a logged-in look | same | same |
| Confusion with competitors | none in [competitors.md](competitors.md) | none | none |

Trademark: search the name in classes 9 (software) and 42 (software services) on [INPI](https://data.inpi.fr/) (France), [EUIPO eSearch](https://euipo.europa.eu/eSearch/) (EU) and [USPTO](https://tmsearch.uspto.gov/) (US). These are public searches only; a trademark lawyer confirms, and nothing is registered until the founder registers it. Not legal advice.

### Voice and promise

- **Promise:** every field matches, or every difference is shown with its evidence. Nothing leaves your machine unless you send it.
- **Taglines:** "Proof your app still does the same thing." / "Same app. Proven." / "Every field, before and after."
- **Voice:**
  - *Exact.* Do: "69.21 before, 69.22 after, on the Total field." Don't: "minor discrepancies detected".
  - *Calm.* Do: "1 difference, 37 fields equal." Don't: "Critical alert! Regression!"
  - *Plain.* Do: "The comparison is plain code." Don't: "AI-powered deterministic verification engine".
- **Before / after (pitch v1, line 3):** "After any change, Parity replays the same scenarios on the old and new versions and shows every field that differs, with the evidence." becomes "Change anything. Parity replays your app before and after and shows every field that moved, with proof."

### The look (already built; keep it)

- **Colour:** Night `#0B0D12` (background), Ink `#F2F4F8` (text, about 18:1 on Night), Blue `#4C6FFF` for marks and live work, Blue deep `#2A4BFF` for filled buttons (white text 5.9:1, passes WCAG AA). Status colours only report results.
- **Type:** Geist and Geist Mono, SIL Open Font License, free from Google Fonts; already in `brand/fonts`.
- **Logo:** the P with one pixel broken away, already drawn (`brand/masters`). It works at 16 px as the tile icon. Add "Proof" as a second word in Geist only if the name changes.
- **First five touchpoints:**
  1. The README hero: the one-cent diff, legacy and rebuilt side by side.
  2. The terminal output of the first run: one line per field, equal in grey, different in red.
  3. The one-page proof report (light document style from `screens.html`).
  4. The submission thread on X.
  5. The reply to the first issue: thank, reproduce, link the fix.

## Operations

A one-person open-source project built in 9 days on one laptop. The "daily cycle" is the build loop during the hackathon, then the maintenance loop after it.

### The daily cycle (hackathon, Oct 27 to Nov 4)

1. Read the sprint checklist (`docs/sprints.md` in the private repo) and pick the day's one goal.
2. Start one sandbox only (Wine or FrontAccounting), capped at 1 GB.
3. Build; run tests, typecheck, lint.
4. Run the end-to-end scenario on Virtual Salesman 3; record what broke.
5. Check Meta credit spend on dev.meta.ai Billing; log it.
6. Commit through a branch and PR to the public repo. *(customer sees: the repo)*
7. Post the day's clip on X. *(customer sees)*
8. Stop Docker; note tomorrow's goal.

After the hackathon: triage issues daily, one release a week, reply to every stranger who ran it on their own app. *(customer sees)*

### Suppliers (tools and services)

| input | supplier | price and terms | source |
|---|---|---|---|
| Models: capture, rules, computer use, explanations | Meta Model API | $150 hackathon credits; then $1.25 / $4.25 per M tokens (Spark 1.3) | dev.meta.ai pricing (private repo notes) |
| Open-weight rule extraction | Muse Spark Open on Baseten | hackathon access; post-hackathon price not checked: get a quote | open question |
| Code generation | Muse Code CLI | uses Meta credits | dev.meta.ai docs |
| Repo, CI, releases | GitHub | free for public repos; private CI was blocked by billing earlier, check before relying on Actions | private repo history |
| Sandboxes | Docker Desktop, Wine, Alpine PHP + MariaDB images | free | already running |
| Hosted tier (later) | any cloud VM | estimate $40 a month; get a quote | [cfo-sources.md](cfo-sources.md) |

No price in [numbers.json](numbers.json) changed; the CFO does not need to re-run.

### People

One person: the founder does everything. Hackathon hours are the founder's choice; the plan assumes about 8 focused hours a day, with the internal deadline Nov 4, 20:00 Paris. No wages, so no payroll. After the hackathon: look for a second maintainer (several panel buyers ask for "more than one maintainer" before trusting it).

### Routines

**Start of day (10 min).** Pull, read yesterday's note, check credits, start one sandbox.

**Core loop (each feature).** Write the scenario first, build, replay on VS3, check noise, commit, PR.

**Credit check (daily).** Billing page; if spend is over $100, switch rule extraction to Muse Spark Open and stop new code-generation runs until the demo is recorded.

**Demo recording (Nov 3).** Fresh sandbox, scripted path, three takes, pick the cleanest, never fake a step: every second shown is real.

**Issue from a stranger (after launch).** Thank them, ask for the smallest reproduction, label it, fix or explain within 48 hours, link the fix.

### Tools

GitHub (repo, issues, releases), Bun + TypeScript, Docker, the Meta dashboard for spend, a plain markdown log in the private repo. Nothing paid.

### Licences, permits, rules

- **Open-source licence:** pick before the repo goes public (MIT or Apache-2.0; Apache-2.0 adds a patent grant). Tracked as issue #30 in the private repo.
- **Hackathon rules:** public repo, new work only, Standard tier models, 3-minute video ([private repo `docs/hackathon.md`](https://github.com/GlamgarOnDiscord/parity)).
- **Personal data:** recordings can show customer data. In France and the EU, GDPR applies to whoever processes them; the tool's default must keep recordings local and the README must say so. Demo data stays fictional. Confirm with the [CNIL](https://www.cnil.fr/) guidance before any real customer use.
- **Meta credits terms:** free credits allow content to be used for product improvement (Billing page). Do not send real customer data under free credits.
- **Trademarks:** see [brand.md](brand.md).

Rules change and differ by place; confirm each with the authority or a professional. Not legal advice.

### Risk register

| # | risk | likelihood | impact | plan |
|---|---|---|---|---|
| 1 | Field matching between old and new UI is unreliable | high | high | design it day 1; fall back to explicit field mapping per screen |
| 2 | Noise floods the diff | high | high | volatile-field masking before any other feature; measure false diffs on VS3 and FrontAccounting |
| 3 | Computer-use exploration under Wine is slow or flaky | high | medium | optional; the demo works from the recording alone |
| 4 | Credits run out | medium | high | daily check, $100 alert, cache, Muse Spark Open for bulk |
| 5 | Laptop RAM: sandbox plus dev server plus browser crash | medium | medium | one sandbox at a time, 1 GB cap, stop Docker after use |
| 6 | Muse Code output does not converge to parity | medium | high | pre-defined repair loop with a stop after N tries; show the remaining diff honestly |
| 7 | Demo looks hand-picked | medium | medium | second app (FrontAccounting) the founder did not write |
| 8 | Keploy or Meticulous ships the same idea | medium | medium | lead with any-app, offline, readable proof; ship fast |
| 9 | Founder exhaustion near the deadline | medium | high | internal deadline Nov 4 20:00 Paris; cut list frozen day 3 |
| 10 | Submission form or video upload fails at the last minute | low | high | upload the video by Nov 4 noon; keep a backup link |

## Launch plan

The launch is the hackathon submission on **Nov 4, 2026** (official deadline 21:00 ET = Nov 5, 03:00 Paris; internal deadline Nov 4, 20:00 Paris). Building may start Oct 27, 00:00 ET (05:00 Paris).

### Step 1: the cheapest real test, before the build

Free open-source product, so the test is attention and trial, not money.

- **Test:** on Oct 27, post the one-cent story on X ("every line looks right, the total is off by a cent; I am building the tool that catches this, follow along") with a link to the public repo (README with the problem and a "watch" button). Ask one question: "Would you run this on your app?"
- **Success line, written before:** by Oct 31, at least 25 people star or watch the repo or reply that they would try it, and at least 3 describe an app of their own it should work on.
- **Compare with the panel:** the panel says 40 % would try it after the full README. If real interest is far below, the problem is reach or the hook, not the product: rewrite the hook ([marketing.md](marketing.md)) before building more features.

### Step 2: the countdown (owner: the founder, for every task)

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

### Step 3: launch day run sheet (Nov 4, Paris time)

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

### Step 4: the first 30 days (Nov 5 to Dec 4)

- **Weekly numbers:** stars and clones; strangers who ran it on their own app; X views on the thread.
- **Triggers:** under 50 stars by Nov 11, rewrite the README hero; zero strangers running it by Nov 20, offer to run it for three people on their app; any issue about noise, fix before anything else.
- **Reviews:**
  - Day 7: Did the Show HN go out? What did commenters doubt?
  - Day 14: How many real apps has it run on? What broke first?
  - Day 30: Does anyone want the hosted Team tier or a migration report enough to pay? If 3 say yes with a price, start the paid test in [pricing.md](pricing.md).

_The panel is simulated buyers and the numbers are projections from your inputs. Confirm demand with real customers and costs with real quotes before you spend. Not financial, legal or tax advice._
