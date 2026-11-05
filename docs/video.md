# Video: script, shots and export

The 3:00 demo video, written from the product as it is after D7. Every shot is a real run of a command below; nothing is mocked or re-typed after the fact. Replaces the D1 timeline in [pitch.md](pitch.md), which predates fuzzing, the pull-request check, MCP and migration.

Recordings, voice and music files are never committed (`recordings/` is ignored). The finished video goes to the submission platform and YouTube; only the README GIF and report image live in `docs/media/`.

## Script (3:00)

Voice-over in plain sentences, about 150 words a minute. The numbers on screen and in the voice are the measured ones in [benchmarks.md](benchmarks.md).

| time | on screen | voice |
|---|---|---|
| 0:00-0:12 | Shot 1: two invoices side by side, 69.21 and 69.22, the Total row circled | "Every line of this invoice is right. The total is one cent off. Every test passes." |
| 0:12-0:30 | Shot 2: Virtual Salesman 3 under Wine, a 2006 Windows app | "This is how old business software dies: someone rewrites it, nobody can say what the old one really did, and the bugs that slip through are business bugs. Parity rebuilds the app and proves the new one does the same thing, field by field." |
| 0:30-0:55 | Shot 3: `parity capture` on the narrated recording, then the review screen: a rule with its evidence frame, accepted in a click | "You record someone using the old app and talking. Muse Voice Transcribe reads the narration, Muse Spark and SAM read every field on every key frame, and the business rules come out in plain language, each with its evidence. The formulas are checked against the recorded values by code. An expert accepts them in a click." |
| 0:55-1:15 | Shot 4: `parity rebuild`, Muse Code at work, then the GIF: legacy left, rebuilt right | "Muse Code builds the web app from the accepted rules. Parity replays the same invoice on it: eight of eight fields equal, first try, forty-six cents." |
| 1:15-1:35 | Shot 5: `bun run prove` on the naive rebuild, the red Total line, then the one-page report | "And when a rebuild adds the rounded taxes instead of rounding once, Parity names the field: 69.21 before, 69.22 after. AI never decides what the same means. The comparison is plain code." |
| 1:35-1:55 | Shot 6: FrontAccounting in Docker, `parity fuzz`, a difference shrunk to one or two lines, then parity on 52 fresh cases | "On an app nobody here wrote, FrontAccounting, Parity fuzzes the rebuild against the live app. It found three items the recording never showed, shrank each to a one- or two-line invoice, and one repair closed them." |
| 1:55-2:15 | Shot 7: a pull request that breaks the cent, its red check and the verdict comment; then Muse Code calling `prove` over MCP | "The proof stays. Every pull request is replayed by a GitHub Action, with no model call; a change that breaks the cent fails its check. And a coding agent can call Parity itself, through MCP, before it opens its pull request." |
| 2:15-2:35 | Shot 8: Muse Spark computer use exploring FrontAccounting, Sales Types found; then the migration board, three screens proved | "Muse Spark computer use explores the app alone, confined to it, and turns the screens nobody recorded into tests. Migration mode goes screen by screen: customers, items and invoices, on records read through the old app's own forms, each one proved." |
| 2:35-2:50 | Shot 9: the network cut, `prove` still passing; the send log with every call and its cost | "Nothing leaves your machine unless you send it. Cut the network: the proof still runs. Every model call is in the send log, with its cost. The whole hackathon cost eighteen dollars." |
| 2:50-2:59 | Shot 10: the landing page, the repository, the logo | "Parity. Record it once, prove it forever. Open source." |

## Shots and the command behind each

Record at 1920×1080, 30 fps, the terminal at 18 pt on the dark theme of [DESIGN.md](../DESIGN.md). Each shot is short; trim in the edit, never speed up a number.

| shot | how to film it | spend |
|---|---|---|
| 1 | `bun run report --proof fixtures/proofs/vs3-invoice.json --fixture`, open `runs/report.html`, zoom on the Total difference | none |
| 2 | The original VS3 recording (kept outside the repository, [D3](decisions.md)) | none |
| 3 | `bun run capture recordings/vs3.mp4 --sam "text field"` (SAM is off unless `--sam` names what to find), then `bun run dev` and the review link printed at launch | about $0.30, or replay an existing run from `runs/` |
| 4 | `bun run rebuild runs/<vs3 run>`; the side-by-side from `bun run record:replay runs/<vs3 run>` | about $0.50, or reuse the D1 run |
| 5 | `bun run prove`, then the report from shot 1 | none |
| 6 | `docker compose -f sandboxes/frontaccounting/compose.yaml up -d --build`, then `bun run parity fuzz fixtures/fuzz/fa-invoice.json --proof <proof> --reference-url http://127.0.0.1:8080/ --app <app> --seed 1 --count 12` for the differences, the same with `--repair` for the fix, then seed 1 again and `--seed 2`, `--seed 3` for the fresh cases (52 in all) | $0.46 for the repair, the rest none |
| 7 | A branch that changes `examples/invoice/index.html` to add rounded taxes, its pull request and the Parity check; `bun run parity mcp` attached to Muse Code calling `prove` | none for the check; a repair run if filmed live |
| 8 | `bun run explore <proof> --url http://127.0.0.1:8080/ --steps 8 --max-usd 0.2 --ack computer_action_requires_confirmation --save`, then `--from <exploration.json> --save-acknowledged` once its steps are read; then `/migrate/<run>` from `bun run dev` | about $0.10 |
| 9 | `sudo unshare --net -- bash scripts/ci-offline.sh "$(command -v bun)" "$(id -un)"` on Linux (needs `ip`), then the send log of a run in the diff screen | none |
| 10 | The GitHub Pages landing page (`site/index.html`) and the repository page | none |

The network-cut clip (shot 9) doubles as the short clip of D9: export it alone, 15 seconds, for the X thread.

## Voice, music, captions

- Voice: the founder reads the voice column once, in one take per row, on a USB microphone; noise reduction only.
- Music: one royalty-free track under the voice at -24 LUFS, the voice at -16 LUFS; credit it in the description.
- Captions: [video.srt](video.srt), the voice column timed to the script. Burn them in for X, keep them as a separate track for YouTube.
- Check before export: every number heard is on screen in the same shot, and every number on screen is in [benchmarks.md](benchmarks.md).

## The cut made on 2026-11-04

A full 2:59 cut exists, built only from real material: the report, the VS3 recording and side-by-side, the review, diff and migration screens of the local server, the terminal output of `bun run prove`, `prove --fixed` and the D6 fuzz run, the comment the Parity check posted on a real pull request, the screen exploration found, the migrated invoice and the landing page. Stills get a 4 % push-in; nothing is retyped or mocked.

Where it differs from the script above:

- Shot 6 shows the D6 run (the tax cent found by fuzzing, the table of cases around it, one repair for $0.36, parity) instead of the D4 items; the voice line says so.
- Shot 7 is [pull request #120](https://github.com/GlamgarOnDiscord/parity-agent/pull/120): the example invoice changed to round each tax first, the Parity check failing and its comment naming Total 69.21 → $69.22 and Balance 49.21 → $49.22. It was closed unmerged.
- Shot 9 shows the send log only. The network cut needs Linux (`unshare --net`); the same proof without network runs in the `offline` CI job on every push.
- The voice is a draft read by Windows' built-in English voice, so the cut can be timed; the founder's take replaces it row by row with the same timing. There is no music yet. [video.srt](video.srt) matches the draft voice.

## Export

```bash
ffmpeg -i parity-edit.mov -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart -t 179 parity-demo.mp4
```

`-t 179` cuts at 2:59 whatever the edit says, which is why the last shot is timed to end there; check the length with `ffprobe -v error -show_entries format=duration -of csv=p=0 parity-demo.mp4`.

The X cut: the first 0:12 and shot 5 trimmed to 18 s, 30 seconds, square 1080×1080, captions burnt in.

## The cut published on 2026-11-05

Published: https://youtu.be/ke7WQ8_DfJs (2:05, unlisted). It replaces the earlier cuts, now private.

- Ten scenes rendered frame by frame from one HTML page (headless Chrome, 30 fps), in a flat black style: Geist type, hairline cards, one blue accent, no glow, blur or drop shadows.
- Voice: one ElevenLabs take split at its pauses, each line placed half a second into its scene. Music: a quiet bed synthesized in code, ducked under the voice.
- Captions burnt in from the same lines, in Geist.
- The README GIF is cut from this video (cold open and the proof scene).
