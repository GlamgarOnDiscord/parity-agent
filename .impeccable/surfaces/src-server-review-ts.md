---
version: 1
slug: "src-server-review-ts"
primary_target: "src/server/review.ts"
related_targets: ["src/server/diff.ts"]
---

# Surface brief: rule review and diff

Scope: the two app screens served by `src/server/app.ts`, `/review/:run` (rule review) and `/diff/:run` (diff). Mode: Operate. Audience: the developer or IT consultant who runs Parity, and the business expert who accepts rules and reads the diff. The diff is also the screen the hackathon video shows; the founder asked that it lead with full coverage, then the differences inside it.

Constraints: server-rendered HTML from Hono, no framework, no external font, script or image; fonts served from `src/server/assets/fonts`. Real data only (rules, proof result, coverage, send log); nothing invented, no WHEN/THEN conditions the rules do not have.

## Direction contract

THESIS: Proof you can see the edges of. Both screens show the whole extent first (every rule with its check counts, every field with its state) and let the one that matters stand out by status colour alone. Refuses the generic SaaS dashboard of same-size KPI cards and charts with nothing behind them.

OWN-WORLD: The founder's pinned world, from the eight Pinterest-derived screens: near-black stack (#0E0E10 ground, #111113 app, #19191C cards on 1 px #26262B lines), Geist for reading, Geist Mono for values and ids, tabular numerals, blue #4C6FFF for marks and live work, #2A4BFF filled buttons, green/red/amber only for results, 32-segment tick meters, radius 14 cards and 8 inputs, flat, no shadows or gradients.

STORY: The operator sees which rules are verified by code and which wait; the expert reads one rule in plain words with its evidence and validates it. On the diff, the visitor sees 8 fields compared, 7 equal, 1 different, what was never tested, then drags across the same invoice on both apps and sees 69.21 and 69.22.

FIRST VIEWPORT: Review: left rail of rules with status; centre the selected rule, title 34 px, statement, formula as field chips, origin; right activity column (extracted, narration, checked by code) with Reject and slide-to-validate at its foot. Diff: header with run and verdict; a row of three meters (fields equal, never tested, sent and cost); below, fields per checkpoint as tick meters beside coverage tick rows.

FORM: Pinned by the founder (moodboard round before the kickoff): rule review after a proposal activity panel, diff after a voice-agent call detail and an agent performance card, signature move the before/after split with a draggable knob over the legacy frame and the rebuilt screen. seed: none (direction pinned by the founder).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
