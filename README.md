# Parity

**Parity rebuilds old business software as a modern web app, and proves the new app does exactly what the old one did.**

Point it at an app nobody fully understands anymore: an old Windows program, a legacy web tool. Parity watches it being used, explores it on its own, writes down its business rules in plain language for an expert to confirm, generates the new app, then replays the same scenarios on both versions until every field matches. Then the proof stays: replay it after any later change, by a person or an AI coding agent, and see every field that moved.

```
record ─► explore ─► rules ─► rebuild ─► prove ─► keep proving
```

| step        | what happens                                                                                                            | Meta model                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Record**  | A screen recording of someone using the old app, narrated if they like ("the Quebec tax always goes on top of the GST") | Muse Voice Transcribe                                                      |
| **See**     | Fields, buttons and screens are found on every key frame                                                                | SAM 3.1, Muse Spark                                                        |
| **Explore** | The agent drives the old app in a sandbox to reach screens and error paths the recording missed                         | Muse Spark (computer use)                                                  |
| **Rules**   | Business rules written in plain language, each with its evidence, for an expert to accept or reject                     | Muse Spark, Muse Wonder for hard cases, Muse Spark Open for on-premise use |
| **Rebuild** | A new web app generated from the accepted rules, repaired difference by difference                                      | Muse Code                                                                  |
| **Prove**   | Every scenario replayed on both apps; fields matched and compared in plain code                                         | none: the proof is deterministic                                           |

## Principles

- **AI never decides what "the same" means.** Matching and comparison are plain code. AI captures, proposes and explains.
- **Noise is measured, not guessed.** Each scenario runs twice on the same app; anything that changes on its own (a timestamp, a generated id) is masked and shown as masked.
- **Nothing leaves your machine unless you send it.** Replays and diffs run offline. Every model call is logged with its cost and the bytes sent.
- **A clean report is never silent.** Fields with no counterpart and screens never tested are listed, not dropped.

## What works today

The proof engine runs end to end in a real browser. On an invoice from Virtual Salesman 3, an old Windows sales app that adds unrounded taxes and rounds once, against a rebuilt web invoice that rounds each tax first:

```
$ bun run prove

Reference: Virtual Salesman 3   Candidate: http://127.0.0.1:40941/   (996 ms, 2 runs each)
Volatile, masked: Printed at, Reference

s2-invoice-gst-qst › invoice (step 6)
  = Customer: Nantes Builders      Bill to: Nantes Builders
  = Sub Total: 59.94               Subtotal: $59.94
  ✗ Total: 69.21                   Total: $69.22
  = GST (5%): 3.00                 Federal tax (GST 5%): $3.00
  = QST (9.975%): 6.28             Provincial tax (QST 9.975%): $6.28
  ✗ Balance: 49.21                 Balance due: $49.22
  ...
  8 equal, 2 different, 0 masked, 0 missing

NO PARITY: differences above.
```

Every line looks right; the total is one cent off. `bun run prove --fixed` replays the corrected rebuild: 10 equal, parity.

| part                                                                     | status                                     |
| ------------------------------------------------------------------------ | ------------------------------------------ |
| Field matching across two UIs with different labels and layouts          | done                                       |
| Deterministic replay, field diff, noise detection                        | done (web apps)                            |
| Send log with cost per model call, shown per run in the review screen    | done                                       |
| Clients for every Meta model by role                                     | done, verified with real calls             |
| Capture from a recording (transcription, SAM, field reading)             | done                                       |
| Rules in plain language with evidence, review screen                     | done                                       |
| Rebuild and repair with Muse Code                                        | done: VS3 (2006) rebuilt at parity, $0.46  |
| Coverage map: checked, explained by a rule only, never tested            | done                                       |
| Playwright export of a proof (`bun run export:playwright`)               | done                                       |
| Second app nobody here wrote: FrontAccounting 2.4.20, noise measured     | done ([benchmarks](docs/benchmarks.md))    |
| Autonomous exploration, one-page proof report                            | next                                       |

Plan and exit checks: [docs/sprints.md](docs/sprints.md).

## Run it

```sh
bun install
cp .env.example .env    # add MODEL_API_KEY for the model calls
bun test                # includes two end-to-end runs in headless Chrome
bun run prove           # the one-cent example above
bun run dev             # local API on http://127.0.0.1:8787 (token printed at launch)
bun run models:check    # one real call per Meta model, a few cents
```

Second app, FrontAccounting in Docker (no model call):

```sh
sh sandboxes/frontaccounting/fetch.sh
docker compose -f sandboxes/frontaccounting/compose.yaml up -d --build
bun run record:reference fixtures/scenarios/frontaccounting-invoice.json --url http://127.0.0.1:8080/ --runs 5
bun run prove --proof fixtures/scenarios/frontaccounting-invoice.proof.json --url http://127.0.0.1:8080/
```

Needs Bun and a local Chrome or Chromium (`PARITY_CHROME_PATH` to point at one). The browser runs headless with a throwaway profile.

## Design choices

Browser drivers and model clients are chosen by configuration, so they can be benchmarked and swapped ([docs/decisions.md](docs/decisions.md)). Stack: Bun, TypeScript, Hono, SQLite, Zod, Puppeteer over CDP, the Vercel AI SDK and the OpenAI SDK pointed at the Meta Model API.

## Research behind it

Before writing code, the idea went through a product review: a board of three framework lenses, a competitor map, a simulated buyer panel (15 % would try the first pitch, 40 % the revised offer), pricing, a credit budget and a launch plan. All of it is in [`founder/`](founder/summary.md), with the pitch in [`docs/pitch.md`](docs/pitch.md). The panel is simulated and the numbers are projections.

## Licence

To be chosen (MIT or Apache-2.0).
