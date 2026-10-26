# Board brief: Parity

## The idea

Parity is an open-source agent that records how a piece of software behaves and turns that recording into a replayable proof. Once the proof exists, any change to the software can be checked against it: the same scenarios are replayed on the old and the new version, every field is compared, and each difference is shown with an explanation and the evidence behind it.

How it works today (design, not yet built):

1. Someone records a screen video of the app in use, optionally narrating ("here I apply the discount for loyal clients"). Muse Voice Transcribe turns the narration into text linked to frames.
2. SAM 3.1 segments the UI elements on the frames. Muse Spark, with computer use, then explores the app on its own in a sandbox (Docker; Wine for old Windows apps) to find screens and branches the recording did not show.
3. Business rules are extracted in plain language ("state tax is computed on subtotal plus federal tax") for a human expert to validate or reject.
4. The validated rules and recorded scenarios become the proof: a replayable suite.
5. Any new version (a rebuild generated with Muse Code, a refactor by an AI coding agent, an upgrade) is replayed against the proof until every field matches, or the difference is accepted on purpose.

Replays and comparisons are deterministic and need no AI; AI is used once to capture, and again only to explain differences.

The original version of the idea was narrower: rebuild a legacy business app as a web app and prove parity. That use case stays as the demo. The pitched version widens it to any change to any software.

## Who it is for

As many people as possible: developers and teams changing software they did not write (with AI coding agents, migrations, upgrades); IT service providers rebuilding old business apps; non-technical owners who need to know a new app does the same thing as the old one.

## Price

Free for now. Open source; no paid tier decided.

## Founder and constraints

One developer, a French BTS SIO (IT) student, building solo for a nine-day AI hackathon, Oct 27 to Nov 4, 2026 (9 days). 150 USD of Meta API credits; one laptop with little free RAM and disk. Must use Meta models. Only work built during the hackathon can be shown. Submission: a public repo and a 3-minute video. Judging weights: impact 30 %, use of Meta tooling 25 %, technical depth 20 %, demo 25 %.

Already done before the hackathon (allowed: setup only): two test targets run in sandboxes, an old Windows sales app (Virtual Salesman 3, under Wine, about 165 MB of RAM) where 15 business rules were observed by hand, including a one-cent rounding difference on a tax-on-tax total; and FrontAccounting, an open-source PHP accounting app (about 205 MB). Brand and UI mockups exist.

## Context the founder gathered (public sources, quality varies)

- Legacy modernization: vendor blogs cite a 70 % failure rate for modernization projects (original source not verified); the UK bank TSB's 2018 migration ended with a reported 330 million GBP bill, attributed to the old system being more coupled than expected.
- AI coding agents: a March 2026 preprint (TDAD) reports that agents frequently break tests that used to pass, and that benchmarks mostly ignore regressions. A Faros AI study, cited second-hand, reports review time per pull request up about 91 % in teams with high AI adoption.
- Knowledge loss: IT leaders at a 2026 JD Edwards conference said most organizations are not ready to keep systems running when their most experienced staff retire; the hard part is undocumented edge cases.
- Windows 10 support ended Oct 14, 2025; paid extended security updates run to 2028 at a rising yearly price. Many legacy business apps still run on it.

No market size, competitor list or user interviews exist yet.
