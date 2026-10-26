# Parity: competitor map (2026-10-26)

Full facts and links: `competitors.csv`. G2, Capterra and GetApp returned 403 and Reddit could not be fetched, so ratings are GitHub stars only and the complaints come from GitHub issues and Hacker News.

## 1. Competitors, most direct first

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

## 2. Price range (published small-team plans; units differ)

- Lowest: **$0**. Keploy, GoReplay and Playwright have free open-source versions, and AWS lists its mainframe modernization agent as free. Runtime costs $0.31 per CPU core per hour ([AWS](https://aws.amazon.com/mainframe-modernization/pricing)).
- Median of the five paid entry plans ($19, $30, $50, $179, ~$246/mo): **$50/month**.
- Highest published: **GoReplay PRO at $2,950/year**.
- Not public: Mechanical Orchard, Meticulous and Speedscale Pro. These are the enterprise end, and their real ceiling is unknown.

## 3. Positioning map

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

## 4. Complaints, ranked

1. **Noise: false diffs from dynamic or non-deterministic data (17).** There are 11 Keploy issues, for example [#3299](https://github.com/keploy/keploy/issues/3299) "testsets failing because of noisy fields" and #4349 "ordering of elements in an array is treated as a failure" ([bug list](https://github.com/keploy/keploy/issues?q=is%3Aissue+is%3Aopen+label%3Abug)). The other 6 are Hacker News comments on [Tusk](https://news.ycombinator.com/item?id=45887536) and [Meticulous](https://news.ycombinator.com/item?id=31236066): "there are fundamental issues with anything that doesn't reproduce timing perfectly" (inglor).
2. **Narrow stack coverage (10).** Tusk at launch: "Currently only supports Node backends", and "Drift is language specific" ([HN](https://news.ycombinator.com/item?id=45887536)). Meticulous: "without a WS support, not all projects could benefit" ([HN](https://news.ycombinator.com/item?id=31236066)). GoReplay has open requests for TCP, Kafka, SIP and audio ([issues](https://github.com/buger/goreplay/issues)), and Keploy cannot record MySQL cursor fetch (#4261).
3. **Recording misses traffic (8).** Seven GoReplay issues report missed or truncated captures, among them #1247, #1252 and #1269 ([issues](https://github.com/buger/goreplay/issues)). Keploy's recorder can break long-lived HTTP responses (#3997).
4. **Baselines go stale (3).** The Tusk founder: "you'd need to manually re-record traces" ([HN](https://news.ycombinator.com/item?id=45887536)). Keploy has stale mocks in #4488 and #4021.
5. **PII ends up in recordings (3).** "session recording will inevitably slurp up PII" ([HN](https://news.ycombinator.com/item?id=31236066)). Tusk: "no default mode for this at the moment" ([HN](https://news.ycombinator.com/item?id=45887536)).
6. **Lock-in to closed tools (3, all from one 2022 thread).** "very concerned about building up a large suite of tests ... on proprietary tech" ([HN](https://news.ycombinator.com/item?id=31236066)).
7. **"Passing" is not proof (3).** Diffblue's generated tests "passed since Cover did not know the intent of the code" ([The Register, 2020](https://www.theregister.com/2020/09/21/diffblue_let_ai_code_unit_tests)). AWS's validation tools "are control points, not proof" ([SoftwareReviews, 2026](https://www.softwarereviews.com/vendor-technology-notes/aws-transform-says-it-s-processed-10-billion-lines-of-legacy-code)).
8. **Price (1, thin).** "too scaled back to get good use out of it" ([HN](https://news.ycombinator.com/item?id=31236066)).

## 5. The gap

None of the tools found covers both halves of this: **proving that an arbitrary app (old Windows desktop, legacy web, CLI) behaves the same end to end, and producing a proof a non-developer can read.**

- The players that prove equivalence are mainframe-only ([Imogen](https://www.mechanical-orchard.com/platform); AWS covers "IBM z/OS mainframe batch").
- The open tools are tied to a stack: an SDK for Node or Python, eBPF on the API layer, or JS frontends. They output developer artifacts such as mocks and PR checks (complaint 2).
- Buyers are told to "Require an independent acceptance gate" ([SoftwareReviews](https://www.softwarereviews.com/vendor-technology-notes/aws-transform-says-it-s-processed-10-billion-lines-of-legacy-code)). Today that gate is manual QA or a parallel run.

Caveats:
- Demand from non-technical owners is a **hypothesis**. No source found shows them looking for such a tool.
- Noise is complaint #1 and the hardest problem in this category. "Every difference shown and explained" walks straight into it. If an LLM cannot reliably separate noise from a real regression, Parity inherits the top complaint.

## 6. The threat

- **Keploy, fastest.** It is Apache-2.0 with 18.8k stars, and its headline is already "AI writes code. Keploy catches what breaks". It has the record and replay engine. Adding a browser or desktop recorder plus LLM-written diff explanations is an extension, not a new product.
- **Meticulous.** It reportedly raised $15M in July 2026 and plans to move to full stack ([Dealroom](https://app.dealroom.co/news/note/meticulous-raises-15m-to-test-ai-generated-code-before-it-ships)). Unverified.
- **AWS.** It already gives away equivalence-testing tooling inside a free mainframe agent. If it extends that to Windows or .NET migrations (it already has a Windows agent, [pricing](https://aws.amazon.com/transform/pricing/)), the enterprise end becomes free and bundled.
- **Name.** "Parity" is a generic term in this field. Thoughtworks teaches "black-box parity" testing ([O'Reilly](https://www.oreilly.com/live-events/migrating-spec-less-code-with-ai-and-parity/0642572401733/0642572401726/)), so the name will be hard to find in search.
