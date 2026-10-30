# Sprints

Building opens 2026-10-27 00:00 ET (05:00 Paris). Internal deadline 2026-11-04 20:00 Paris; official deadline 21:00 ET (Nov 5, 03:00 Paris). Each day is a GitHub milestone with the same name; a day is done when its exit check passes.

Judging: impact 30 %, Meta tooling 25 %, technical depth 20 %, demo 25 %.

Never cut: field matching, deterministic replay, volatile-field masking, the one-cent catch, the proof report.

## Plan v2 (2026-10-27)

The first plan held one sprint per day and S1 to S8 landed on the first day (PRs #31 to #55). Plan v2 at least doubles the work per day. Each day names its exit check and its model spend; the credit line is the $150 of Meta credits, about $3.6 spent so far. The video moves to the end, once the product it shows is final.

### D2 Keep proving (Oct 27)

- Offline proof: replay, diff and report run with the network cut, checked by a test (S5 exit, still open)
- One `parity` command with subcommands (`prove`, `report`, `explore`, `capture`, `rebuild`, `dev`) instead of loose scripts
- GitHub Action: `parity prove` on every pull request, the report attached and the verdict commented, no model call
- MCP server: `prove`, `diff`, `rules` and `report` as tools, so a coding agent (Claude Code, Muse Code) checks its own change before it opens a pull request
- Muse Code repair runs with the Parity MCP server attached and proves its own fix

Exit: a pull request that breaks the cent fails its check with the report attached; an agent calls `prove` through MCP. Spend: one repair run, about $0.6.

### D3 The legacy app you can replay (Oct 28)

- FrontAccounting end to end: a narrated recording made in the sandbox, capture, rules, review, Muse Code rebuild, proof against the live FrontAccounting (both sides replayed, not a recording) (done: parity on 65 fields)
- Sales invoice with discounts, tax-included prices and two items, the screen that carries most rules
- Rule extraction scored against hand-observed FrontAccounting rules (precision and recall in `docs/benchmarks.md`)
- Diff screen and report for the FrontAccounting run

Exit: the rebuilt FrontAccounting invoice replays against the real FrontAccounting with every field equal or a named difference. Spend: capture about $1, rebuild and repairs about $2.

### D4 Find more than one cent (Oct 29)

- Differential fuzzing: generated invoices (quantities, prices, discounts, items) replayed on FrontAccounting and on its rebuild, seeded and reproducible
- Shrinking: a failing invoice is reduced to the smallest one that still differs
- Each new difference becomes a scenario in the proof, so it is never lost
- Repair loop on fuzz failures until a fuzz budget of N invoices passes

Exit: fuzzing finds at least one difference the recording did not show, shrinks it, and the repair closes it. Spend: repairs about $2. (done: three unrecorded items found and shrunk to one line, closed by a $0.46 repair, then 52 fresh cases at parity; $1.68 in all)

### D5 Differences people decide (Oct 30)

- Accept a difference: the expert marks it as a legacy bug kept on purpose or a change accepted, with who and why, stored in the proof and shown in the report
- "Send to Muse Code" from the diff screen: one click starts a repair with the difference as evidence, progress shown live
- Repair history per run: iterations, cost, fields equal over time (the parity card of the mockups)
- Muse Spark Open on Baseten for rule extraction, if a key is available (open-weights bonus)

Exit: from the diff screen, one difference is accepted with a reason and another is repaired by Muse Code in one click. Spend: about $1. (done: the VS3 cent accepted with a name and a reason; one click brought FrontAccounting item 301 back for $0.41, and the replay after it caught a tax regression the repair introduced, closed in D6; $0.81 in all)

### D6 Exploration that writes tests (Oct 31)

- Exploration traces become scenarios: each new screen found by Muse Spark computer use is turned into replayable steps with label-based targets and recorded as reference
- Coverage map counts explored screens and scenarios; the diff shows what exploration added
- Desktop replay of Virtual Salesman 3 under Wine with Muse Spark computer use, so the Windows app can be re-captured on a new scenario without a person

Exit: one scenario that no person wrote is replayed on both FrontAccounting and its rebuild; VS3 is driven by the agent through one invoice. Spend: about $1. (done except VS3: exploration found Sales Types and wrote its scenario, at parity on FrontAccounting and failing on the rebuild, which lacks that screen; the tax cent closed by a $0.36 repair from a table of cases around it; $0.91 in all. VS3 under Wine moves to D9)

### D7 Migration mode, opt-in (Nov 1)

A whole app rather than one screen, for those who pay for it: off by default, `parity migrate` prints an estimate per screen before it starts and stops at the budget given. Every Meta model has its role: Muse Spark computer use explores, Muse Spark reads screens and the data model, Muse Wonder settles the hard rules, Muse Code builds, SAM finds fields on desktop frames, voice transcription reads the narration, Muse Spark Open does extraction on premises.

- Screen inventory: exploration lists every screen with its fields and the links between screens (navigation map)
- Data model from the legacy app: entities and fields read from its list and form screens; records migrated through its own screens, or from a dump the operator provides, into the rebuild's SQLite. No catalogue written into code (the D4 repair did exactly that)
- Modern template for rebuilds: navigation, tables, forms, empty and error states from the design system; the proof stays on values, never on looks
- One Muse Code build per screen on the shared data layer; each screen proved with its scenarios and fuzzed
- Migration board: screens found, rebuilt, proved, differences accepted, spend per screen

Exit: three FrontAccounting screens (customers, items, sales invoice) rebuilt in the modern template on data migrated from FrontAccounting, each at parity or with named accepted differences. Spend: about $10, above the default local cap of $20.

### D8 Video (Nov 2)

- Script for 3:00 from the final product; every shot real
- Screen recordings: recording to rules, rules to rebuild, the one-cent diff, fuzzing, the pull-request check, the agent calling Parity
- Voice and music, captions, export under 3:00
- X thread drafted around the one-cent story (Most Viral on X bonus)

Exit: the final video is exported under 3:00.

### D9 Proof for strangers, buffer and polish (Nov 3)

Moved from D7 when migration mode took that day:

- Landing page with the one-cent story, the GIF and a two-minute start (GitHub Pages, no tracking)
- Benchmarks: replay time and flakiness per browser driver (Puppeteer, Lightpanda), model cost and accuracy per role, noise per app
- Security pass over the whole repository and the threat model written down
- Network-cut demo and the send log as a short clip
Exit: a stranger lands on the page, runs the two-minute start and gets the cent. Spend: none.

Then the buffer:

- Fixes from a full clean-clone run on Windows and in a Linux container
- README, decisions and benchmarks final; issues closed or labelled
- Submission form fields drafted

### D10 Submit (Nov 4)

- Clean-clone check at 09:00; video uploaded by 12:00; submission sent by 16:00, before the 20:00 internal deadline

## Plan v1 (done on 2026-10-26)

### S1 Foundations and field matching (Oct 27)

- Scaffold: Bun, TypeScript, Hono on 127.0.0.1, bun:sqlite, Zod, Biome, tests
- `ModelClient` by role and `BrowserDriver` / `DesktopDriver` interfaces, chosen by config ([decisions.md](decisions.md) D1)
- One real call per Meta model (Spark, Wonder, SAM 3.1, Voice Transcribe, Spark Open on Baseten); Muse Code runs headless
- Send log and credit tracking: every model call logged with its cost
- Field model: a screen is a set of named fields with values; matching between the old Windows screen and a web screen (label, position, value, explicit mapping as fallback)

Exit: the VS3 invoice screen and a hand-made web invoice screen are matched field by field, and the run shows its cost.

### S2 Replay, diff and noise (Oct 28)

- Scenario format (steps, expected fields), versioned JSON proof format
- Deterministic replay on VS3 (DesktopDriver) and on a web app (BrowserDriver)
- Field diff in plain code; volatile fields (dates, ids, timestamps) detected and masked on the first run
- The one-cent catch: legacy 69.21 vs a naive rebuild 69.22 on the Total field

Exit: the one-cent difference is caught on a hand-written scenario, with zero false differences.

### S3 Capture and rules (Oct 29)

- Recording ingestion: key frames on scene changes
- Narration transcribed (Muse Voice Transcribe), aligned to frames
- SAM 3.1 masks on key frames; Muse Spark labels fields and values
- Rules in plain language with evidence; review screen to accept or reject; Muse Wonder for conflicts
- Freeze the cut list

Exit: from one VS3 recording, the tax-on-tax rule is extracted with evidence and accepted in a click; count how many of the 15 hand-observed rules come out.

### S4 Rebuild and repair (Oct 30)

- Generated-app skeleton (Hono, SQLite, HTML)
- Muse Code builds the invoice screen from accepted rules and the field model
- Repair loop: each diff goes back to Muse Code with its evidence, until zero differences or N tries

Exit: the rebuilt invoice screen replays the VS3 scenarios with every field equal.

### S5 Trust features (Oct 31)

- Coverage map: what was recorded, explored and never tested
- Local by default: replays and diffs offline; the send log shown in the UI
- Muse Spark Open path for rule extraction (open-weights bonus)
- Playwright export of proven web scenarios (done: `bun run export:playwright`)

Exit: a run works with the network cut except for capture, and the UI shows every call that left.

### S6 Second app and exploration (Nov 1)

- FrontAccounting as the second target, an app the founder did not write; noise measured (done: [benchmarks.md](benchmarks.md))
- Autonomous exploration with Muse Spark computer use finds a screen the recording missed (done: 4 screens, $0.15)

Exit: one FrontAccounting scenario replays with a clean diff; noise figures recorded.

### S7 Proof report and README (Nov 2)

- One-page proof report (light document style): verdict, each difference with evidence, sign-off (done: `bun run report`)
- README with real numbers only, demo GIF, licence chosen (done: Apache-2.0; a clean clone gets the one-cent diff without a key)
- Code pushed to the public repo through PRs

Exit: a stranger can follow the README on a clean clone and get a diff.

### S8 Polish and video (Nov 3)

- Craft on the two screens that matter: rule review and diff (done: `/review/<run>` and `/diff/<run>`, reviewed until ship)
- Record the 3-minute video from the script in [pitch.md](pitch.md); every second real

Exit: final video exported, under 3:00.

### S9 Submit (Nov 4)

- Buffer for fixes; clean-clone check at 09:00
- Video uploaded by 12:00; submission sent by 16:00, before the 20:00 internal deadline
- X thread at 17:00

Exit: submission confirmed on the platform.

## Cut list, frozen at the end of S3 (2026-10-26)

What S3 showed: a narrated recording already gives the legacy reference. Each key frame is read into fields, so the old app's checkpoints come from the capture itself (proof source `capture`), and only the rebuilt app needs automatic replays.

| item | decision |
|---|---|
| Field matching, deterministic replay of the rebuilt app, noise masking, the one-cent catch | never cut |
| Capture from a recording, rules with code-checked formulas, one-click review | never cut (done) |
| Muse Code rebuild and diff-guided repair | never cut (S4) |
| One-page proof report | never cut (S7) |
| Desktop driver replaying the Wine app automatically | **cut**: the reference comes from the recording; re-capture instead of re-play |
| Autonomous exploration with computer use under Wine | optional, only if S4 lands early (agentic bonus) |
| FrontAccounting as a second app | optional (S6), worth it for "not a hand-picked demo" |
| Playwright export of proven scenarios | optional (S5) |
| Muse Spark Open path | keep, small: same structured client on Baseten once the key exists |
