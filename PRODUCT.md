# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Confirmed by the founder on 2026-10-26:

- **Operator: the developer or IT consultant** who ships changes they cannot fully check: pull requests written by AI coding agents, and rewrites of legacy business software for a client. Often did not write the original app. Runs Parity, reads the field-level detail, asks for repairs.
- **Reviewer: the business expert.** Accountant, sales admin or production lead who uses the legacy tool daily. Not a developer. Reads the rules in plain language, accepts or rejects them, reads the diff, signs the proof report.

## Product Purpose

Parity rebuilds old business software as a web app and proves the new app does what the old one did. It starts from a narrated screen recording, explores the app on its own, writes the business rules in plain language for the expert to confirm, has Muse Code build the new app, then replays the same scenarios and compares every field until they match. The proof stays and is replayed after every later change.

Success: the operator hands the expert a proof the expert can read and sign.

## Positioning

Proof, not generation. Every rule is traced to evidence (recorded frames, narration, agent actions) and every difference between old and new is shown with both values and both screens. Equality is decided by plain code, never by a model. Code migration tools stop at "it compiles"; Parity stops at "it behaves the same, here is every field".

## Operating Context

- Local by default: the server listens on 127.0.0.1, opened through a one-time link printed at launch; replays and diffs run offline; every model call is logged with its cost and bytes.
- The legacy app is known through its recording (Windows apps) or replayed directly (web apps). The rebuilt app runs locally.
- Screens are server-rendered HTML from the Hono server (`src/server/`), no front-end framework, no external font, script or image.
- Outputs: rules with evidence, a rebuilt app, a proof (JSON), a one-page printable report, a Playwright test.

## Capabilities and Constraints

- Rule review: accept or reject each rule; formulas are checked against recorded values by code (verified and contradicted counts).
- Diff: per checkpoint, fields equal, different, noise (measured across runs, masked) and missing; coverage of what the recording showed, what rules explain and what was never tested; screens found by exploration.
- Meta Model API Standard tier only. Credits are limited ($150 for the whole hackathon); every run shows its cost.
- Dev machine has limited RAM and disk; screens stay light.

## Brand Commitments

- Name: Parity. Logo: the P with one pixel broken away (`founder/brand.md`).
- Voice: exact, calm, plain. "69.21 before, 69.22 after, on the Total field", never "minor discrepancies detected".
- Visual direction chosen by the founder before the kickoff: near-black, dense, calm app screens close to developer tools; light document pages for what the client signs; blue marks actions and live work; status colours only report results. Geist and Geist Mono. The eight screens rebuilt from the founder's Pinterest references are the visual reference for app screens; they live in the private pre-kickoff repository and are reimplemented here, not copied.

## Evidence on Hand

- Virtual Salesman 3 (Windows, 2006) recorded under Wine: 6 key frames, 6 rules, a rebuilt app at parity on 8 of 8 fields, and a naive variant that shows 69.22 instead of 69.21 (`runs/vs3`, not committed).
- FrontAccounting 2.4.20 invoice: 63 fields, 4 noisy; exploration found 4 unseen screens (`docs/benchmarks.md`).
- No customers, testimonials or usage numbers exist; never invent them.

## Product Principles

1. Proof over promise: no parity claim without the field-level diff behind it.
2. Show the whole extent first: what was compared, what was noise, what was never tested, then the differences inside it.
3. Business language first; formulas, model names and ids on demand.
4. What is not covered is shown as clearly as what is.
5. Say on screen where data went and which Meta model acted.
