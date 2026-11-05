# Submission form, drafted

Fields as they will be typed into the hackathon form on Nov 4 (D10). The founder checks each against the form itself, which may name them differently; nothing here is sent automatically. Numbers come from [benchmarks.md](benchmarks.md).

**Project name**

Parity

**Tagline (one line)**

Rebuild old business software as a web app, and prove the new app does exactly what the old one did, field by field.

**Repository**

https://github.com/GlamgarOnDiscord/parity-agent (Apache-2.0)

**Video**

https://youtu.be/ke7WQ8_DfJs (2:05, unlisted on YouTube). The cut and how it was made: [video.md](video.md).

**Landing page**

https://glamgarondiscord.github.io/parity-agent/ (built from `site/` by the Pages workflow)

**What it does**

Parity watches someone use an old app and talk about it, explores the app on its own, and writes its business rules in plain language with evidence for an expert to confirm. Muse Code rebuilds it as a web app; Parity replays the same scenarios on both and compares every field in plain code until they match. The proof stays: a GitHub Action replays it on every pull request, and a coding agent can call it over MCP. On Virtual Salesman 3, a 2006 Windows app, it caught a rebuild one cent off (69.21 against 69.22) and proved the corrected one, 8 of 8 fields, for $0.46. On FrontAccounting, an app nobody on the team wrote, fuzzing against the live app found three differences the recording never showed, and migration mode rebuilt three screens on migrated records, each proved (28/28, 113/113, 258/258 fields). A three-step page, Rebuild an app, takes anyone from an address and a login to rebuilt screens in a modern template, each proved, with the price shown before anything is spent.

**How Meta models are used**

| model | job |
|---|---|
| Muse Voice Transcribe | transcribes the narration of the recording |
| SAM 3.1 | finds fields on desktop frames |
| Muse Spark | reads screens and the data model, writes rules with evidence |
| Muse Wonder | settles contradictions between rules |
| Muse Spark computer use | explores the app alone, confined to it, and turns new screens into scenarios |
| Muse Code | builds the web app and repairs it from each difference, headless, with Parity attached over MCP |
| Muse Spark Open on Baseten | the same rule extraction on open weights; client ready, not verified (no key) |

All calls on the Standard tier; Parity refuses a Contributor model. Every call goes through a send log with its cost and bytes, and stops at a budget. Total spent during the hackathon: $18.07 as logged on Oct 30.

**Technical depth (what was hard)**

Field matching across two UIs that look nothing alike; deterministic replay with noise measured over repeated runs and masked per grid row; differential fuzzing with shrinking that keeps only cases where every first-differing label still differs; repairs that hand Muse Code a table of the cases around a numeric difference, which found a double rounding no single example showed; a browser confined to the app under test (other origins, ports, WebSockets, WebRTC and popups blocked, each covered by a test).

**Built during the hackathon**

All of it, from Oct 26 after the kickoff; see the commit history and [sprints.md](sprints.md).

**Try it**

```bash
git clone https://github.com/GlamgarOnDiscord/parity-agent.git && cd parity-agent && bun install && bun run prove
```

`bun run prove` exits with code 1 on purpose: it shows the one-cent difference of the naive rebuild, the way a failing test would. `bun run prove --fixed` shows the corrected rebuild at parity and exits 0.

Needs Bun 1.3 or later and Chrome or Chromium; no API key.

**Bonus categories**

- Open Weights: Muse Spark Open path on Baseten (client ready; claim only if verified with a key before submitting).
- Agentic: Muse Spark computer use exploration that writes tests; Muse Code proving its own fix over MCP.
- Most Viral on X: the thread in [x-thread.md](x-thread.md).

**Team**

Solo.
