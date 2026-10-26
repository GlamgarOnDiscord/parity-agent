# Sprints

Building opens 2026-10-27 00:00 ET (05:00 Paris). Internal deadline 2026-11-04 20:00 Paris; official deadline 21:00 ET (Nov 5, 03:00 Paris). One sprint per day, each a GitHub milestone with the same name. A sprint is done when its exit check passes; the next one starts then.

Never cut: field matching, deterministic replay, volatile-field masking, the one-cent catch, the proof report. Cut first if a day slips: autonomous exploration, then FrontAccounting, then Playwright export. The cut list is frozen at the end of S3.

Judging: impact 30 %, Meta tooling 25 %, technical depth 20 %, demo 25 %. Every Meta model in [pitch.md](pitch.md) runs for real by S6.

## S1 Foundations and field matching (Oct 27)

- Scaffold: Bun, TypeScript, Hono on 127.0.0.1, bun:sqlite, Zod, Biome, tests
- `ModelClient` by role and `BrowserDriver` / `DesktopDriver` interfaces, chosen by config ([decisions.md](decisions.md) D1)
- One real call per Meta model (Spark, Wonder, SAM 3.1, Voice Transcribe, Spark Open on Baseten); Muse Code runs headless
- Send log and credit tracking: every model call logged with its cost
- Field model: a screen is a set of named fields with values; matching between the old Windows screen and a web screen (label, position, value, explicit mapping as fallback)

Exit: the VS3 invoice screen and a hand-made web invoice screen are matched field by field, and the run shows its cost.

## S2 Replay, diff and noise (Oct 28)

- Scenario format (steps, expected fields), versioned JSON proof format
- Deterministic replay on VS3 (DesktopDriver) and on a web app (BrowserDriver)
- Field diff in plain code; volatile fields (dates, ids, timestamps) detected and masked on the first run
- The one-cent catch: legacy 69.21 vs a naive rebuild 69.22 on the Total field

Exit: the one-cent difference is caught on a hand-written scenario, with zero false differences.

## S3 Capture and rules (Oct 29)

- Recording ingestion: key frames on scene changes
- Narration transcribed (Muse Voice Transcribe), aligned to frames
- SAM 3.1 masks on key frames; Muse Spark labels fields and values
- Rules in plain language with evidence; review screen to accept or reject; Muse Wonder for conflicts
- Freeze the cut list

Exit: from one VS3 recording, the tax-on-tax rule is extracted with evidence and accepted in a click; count how many of the 15 hand-observed rules come out.

## S4 Rebuild and repair (Oct 30)

- Generated-app skeleton (Hono, SQLite, HTML)
- Muse Code builds the invoice screen from accepted rules and the field model
- Repair loop: each diff goes back to Muse Code with its evidence, until zero differences or N tries

Exit: the rebuilt invoice screen replays the VS3 scenarios with every field equal.

## S5 Trust features (Oct 31)

- Coverage map: what was recorded, explored and never tested
- Local by default: replays and diffs offline; the send log shown in the UI
- Muse Spark Open path for rule extraction (open-weights bonus)
- Playwright export of proven web scenarios (done: `bun run export:playwright`)

Exit: a run works with the network cut except for capture, and the UI shows every call that left.

## S6 Second app and exploration (Nov 1)

- FrontAccounting as the second target, an app the founder did not write; noise measured (done: [benchmarks.md](benchmarks.md))
- Autonomous exploration with Muse Spark computer use finds a screen the recording missed (done: 4 screens, $0.15)

Exit: one FrontAccounting scenario replays with a clean diff; noise figures recorded.

## S7 Proof report and README (Nov 2)

- One-page proof report (light document style): verdict, each difference with evidence, sign-off
- README with real numbers only, demo GIF, licence chosen
- Code pushed to the public repo through PRs

Exit: a stranger can follow the README on a clean clone and get a diff.

## S8 Polish and video (Nov 3)

- Craft on the two screens that matter: rule review and diff
- Record the 3-minute video from the script in [pitch.md](pitch.md); every second real

Exit: final video exported, under 3:00.

## S9 Submit (Nov 4)

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
