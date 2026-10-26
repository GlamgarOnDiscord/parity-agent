# Parity Proof

Record your app once; Parity replays it before and after any change and shows every field that moved, with proof. Nothing leaves your machine unless you send it.

Built during the Meta Global AI Developer Hackathon (indie track, Oct 26 to Nov 4, 2026). Every line of code here was written after the kickoff.

## Run it

```sh
bun install
cp .env.example .env   # add MODEL_API_KEY
bun test
bun run dev            # http://127.0.0.1:8787, local only
bun run models:check   # one real call per Meta model, a few cents
```

Today: field matching between an old Windows screen and its rebuilt web screen (deterministic, no AI), a send log that records every model call with its cost, and clients for every Meta model by role. Replay and diff come next ([sprints](docs/sprints.md)).

## Research and plan

| path                                                                                                                                         | what it is                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [`docs/pitch.md`](docs/pitch.md)                                                                                                             | The hackathon pitch: the one line, each judging criterion, the 3-minute video, the cut list     |
| [`founder/summary.md`](founder/summary.md)                                                                                                   | Half a page: what Parity is, the evidence, the biggest risk, the first thing to build           |
| [`founder/business-plan.md`](founder/business-plan.md)                                                                                       | Everything below compiled into one document                                                     |
| [`founder/board.md`](founder/board.md)                                                                                                       | Three framework lenses scoring the idea (3 fund if, 5 / 10)                                     |
| [`founder/competitors.md`](founder/competitors.md)                                                                                           | Competitor map with sources, the gap and the threats                                            |
| [`founder/panel/results.md`](founder/panel/results.md)                                                                                       | 20 simulated buyers on the current offer (40 % would try it; pitch v1 was 15 %, in `panel-v1/`) |
| [`founder/offer.md`](founder/offer.md)                                                                                                       | The offer built from the panel's objections, and the re-test                                    |
| [`founder/cfo.md`](founder/cfo.md)                                                                                                           | Meta credit budget for the hackathon and a hosted-tier scenario                                 |
| [`founder/marketing.md`](founder/marketing.md), [`brand.md`](founder/brand.md), [`ops.md`](founder/ops.md), [`launch.md`](founder/launch.md) | Positioning, name checks, daily routines, risk register, dated launch plan                      |

The buyer panel is simulated and the numbers are projections. They pick what to test; real users decide.

Research produced with the [Founder skill](https://github.com/Jakeschincariol/founder-skill) (MIT).

## Licence

To be chosen before the code lands (MIT or Apache-2.0).
