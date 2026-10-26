---
name: Parity
description: Local app screens that show the whole extent of a parity proof, then the one field that moved.
colors:
  ground: "#0e0e10"
  app: "#111113"
  side: "#161618"
  card: "#19191c"
  card-raised: "#202024"
  tick-off: "#2a2a30"
  line: "#26262b"
  line-strong: "#313137"
  text-primary: "#f4f4f5"
  text-secondary: "#a1a1aa"
  text-muted: "#8b8b94"
  mark-blue: "#4c6fff"
  button-blue: "#2a4bff"
  link-blue: "#7690ff"
  result-green: "#22c55e"
  result-green-text: "#86efac"
  result-red: "#ef4444"
  result-red-text: "#fca5a5"
  result-amber: "#f59e0b"
  result-amber-text: "#fcd34d"
  capture-white: "#ffffff"
  paper: "#fbfbf9"
  paper-ink: "#0b0d12"
  paper-soft: "#5b6070"
  paper-line: "#dcdde2"
  paper-equal: "#1f7a3f"
  paper-diff: "#b42318"
  paper-noise: "#8a5a00"
typography:
  display:
    fontFamily: "Geist, Segoe UI Variable, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Geist, Segoe UI Variable, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    letterSpacing: "-0.01em"
  figure:
    fontFamily: "Geist Mono, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "28px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  statement:
    fontFamily: "Geist, Segoe UI Variable, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
  title:
    fontFamily: "Geist, Segoe UI Variable, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
  body:
    fontFamily: "Geist, Segoe UI Variable, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  value:
    fontFamily: "Geist Mono, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 400
    fontFeature: "tnum"
  label:
    fontFamily: "Geist Mono, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "0.04em"
rounded:
  tick: "1px"
  tag: "5px"
  chip: "6px"
  control: "8px"
  inset: "10px"
  card: "14px"
  pill: "999px"
spacing:
  tick-gap: "2px"
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "28px"
components:
  button:
    backgroundColor: "{colors.card-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.control}"
    height: "34px"
    padding: "0 14px"
  tag:
    backgroundColor: "{colors.card-raised}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.tag}"
    padding: "2px 7px"
  tag-ok:
    textColor: "{colors.result-green-text}"
  tag-bad:
    textColor: "{colors.result-red-text}"
  tag-warn:
    textColor: "{colors.result-amber-text}"
  tag-blue:
    textColor: "{colors.link-blue}"
  tag-hollow:
    textColor: "{colors.text-secondary}"
  chip:
    backgroundColor: "{colors.card-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.chip}"
    padding: "3px 8px"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.card}"
  tick-meter:
    height: "10px"
    rounded: "{rounded.tick}"
  nav-item:
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.control}"
    padding: "8px 10px"
  nav-item-current:
    backgroundColor: "{colors.card-raised}"
    textColor: "{colors.text-primary}"
  slide-to-validate:
    backgroundColor: "{colors.card-raised}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.pill}"
    height: "42px"
  compare-knob:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.capture-white}"
    rounded: "{rounded.pill}"
    size: "36px"
---

# Design System: Parity

## Overview

**Creative North Star: "The Instrument Panel"**

A near-black, flat operator console. Every screen shows the whole extent first (every rule with its check counts, every field with its state), and lets the one item that matters stand out by status colour alone. Density is high and quiet: 13 px Geist body, 1 px lines, mono for every value and id, tabular numerals everywhere.

Depth comes from tonal steps of near-black, never from shadow. Blue marks what is measured or live; green, red and amber only report results. The recorded screens of the legacy and rebuilt apps are the only white on the page, so evidence reads as evidence.

A second, separate surface exists: the printable proof report, a light paper document that shares the type and the blue pixel but none of the console's tonal stack (see Colors, Document variant).

**Key Characteristics:**
- Tonal near-black stack, 1 px lines, no shadows on surfaces.
- Geist for reading, Geist Mono for values, ids, counts and column labels.
- 32-segment tick meters as the unit of quantity.
- Status colour reserved for results; blue for measured work.
- White only inside captured screen evidence.

## Colors

A cool near-black stack with one blue voice and three result colours.

### Primary
- **Measure Blue** (mark-blue): filled tick segments, the "same" field outline, the frame-crop mark, the logo pixel, selection tint at 35%. At 45% alpha it is the "rule only" partial tick; at 16% the blue tag ground; at 50% the target-chip border.
- **Link Blue** (link-blue): links, run id in the breadcrumb, blue tag text, target chip text, focus ring.
- **Deep Button Blue** (button-blue): declared for filled buttons; no current screen renders one.

### Neutral
- **Ground** (ground): page background, formula well, segmented control well, compare bar, knob and Legacy/Rebuilt pills.
- **App** (app): main column.
- **Side** (side): navigation rail and rule activity column.
- **Card** (card): cards, panels, fact boxes, nav hover.
- **Card Raised** (card-raised): buttons, tags, chips, selected list item, current nav item, slide track.
- **Tick Off** (tick-off): empty tick segments.
- **Line / Line Strong** (line, line-strong): dividers and card borders; strong for button and chip borders, hollow tags, gap ticks, the activity timeline.
- **Text Primary / Secondary / Muted** (text-primary, text-secondary, text-muted): headings and values; body and inactive nav; metadata, timestamps, column labels.
- **Capture White** (capture-white): ground behind recorded screens (compare, field strips, frame thumbs) only.

### Results
- **Green** (result-green, text result-green-text): equal, tested, verified, accepted. Tag ground at 12% alpha, banner at 10%.
- **Red** (result-red, text result-red-text): different, missing, contradicted, rejected. Tag ground 14%, table row tint 6%, field outline with a 22% halo.
- **Amber** (result-amber, text result-amber-text): noise (masked fields), and pending/waiting state.

### Document variant (proof report)
Light paper surface, A4 print: paper ground, paper-ink text and 2 px header rule, paper-soft secondary, paper-line dividers, button-blue for the logo pixel, paper-equal / paper-diff / paper-noise for verdicts and rows. No cards, no radius, no tick meters; differences are boxed in a 1 px paper-diff border with a 4 px left edge.

### Named Rules
**The Results Only Rule.** Green, red and amber report a result or a review state. They never decorate, never label a section, never fill a button.

**The Gap Is Not A Failure Rule.** Never-tested coverage is shown hollow (outlined tag, outlined tick), never red. Red belongs to differences only.

**The Evidence Is White Rule.** White grounds appear only behind captured screens.

## Typography

**Display Font:** Geist (variable, self-hosted woff2, OFL), fallback Segoe UI Variable, system-ui
**Label/Mono Font:** Geist Mono (variable, self-hosted woff2, OFL), fallback ui-monospace, Cascadia Mono, Consolas

**Character:** a neutral grotesk for reading paired with its own mono for anything that is a value, so numbers and ids line up and read as data.

### Hierarchy
- **Display** (600, 34px, 1.15, -0.02em): selected rule title on review; the verdict line on the proof report (700).
- **Headline** (600, 22px, -0.01em): diff page title beside the verdict pill.
- **Figure** (Geist Mono 500, 28px, 1): meter totals ("7 / 8"), with a 14px muted unit.
- **Statement** (400, 17px, 1.55, max 62ch): the rule in plain words.
- **Title** (600, 14px): panel headers; 13px 600 for activity step titles.
- **Body** (400, 13px, 1.5, tabular-nums): everything else.
- **Value** (Geist Mono, 11 to 15px): ids, frame numbers, table values, before/after values, meta counts.
- **Label** (Geist Mono 500, 11px, 0.04em, written uppercase in source): table column heads and the FORMULA label over the formula well.

### Named Rules
**The Mono Means Data Rule.** If it is a value, an id, a count or a model name, it is Geist Mono. Prose is never mono.

## Layout

App shell: 232px navigation rail beside the main column; below 900px the rail becomes a wrapping row and loses its footer and heading. Top bar 16px by 28px with a 1px bottom line; breadcrumb left, actions right (hidden under 900px on review, 640px on diff).

Review: three columns, rule list 280px, detail fluid (34px 40px padding), activity 360px. At 1200px the activity column drops below; at 760px everything stacks and the origin grid goes from four to two columns.

Diff: single column up to 1360px, 18px gaps. A row of three equal meter cards, then a two-column split (checkpoints and what moved; fields the recording showed), then the compare panel, then one table per checkpoint. Meters and split collapse to one column at 1100px. Under 640px the field strips replace the whole-screen compare by default.

Rhythm: 6 / 10 / 14 / 18 / 28px; card internals 14px by 18px.

## Elevation & Depth

Flat. Depth is tonal: ground, app, side, card, card-raised, each a few steps lighter, separated by 1px lines. Surfaces carry no shadow.

### Shadow Vocabulary
- **Inset hairline** (`box-shadow: inset 0 0 0 1px #313137`): a border that takes no space, on hollow tags and gap ticks. Not elevation.
- **Field halo** (`box-shadow: 0 0 0 4px rgba(239, 68, 68, .22)`, blue at .22 for same): ring around the outlined field on captured screens. Not elevation.
- **Focus ring** (`outline: 2px solid #7690ff; outline-offset: 2px`), and on the compare knob `box-shadow: 0 0 0 3px #7690ff`.

### Named Rules
**The Tonal Step Rule.** To lift something, move it one tone up the stack and give it a line. Do not add a drop shadow.

## Shapes

Soft rectangles on a fixed radius ladder: 1px ticks, 5px tags, 6px chips and segmented options, 8px buttons, nav items and field strips, 10px inset boxes (formula well, check box, facts, banners, list items, compare frame), 14px cards. Full pills for the verdict, the slide track, knobs and the Legacy/Rebuilt labels. Step icons sit in 20px circles. Icons are 16px line SVGs, 1.6 stroke, round caps.

## Components

### Buttons
- **Shape:** 8px radius, 34px tall, 0 14px padding, 500 weight, icon gap 8px.
- **Default:** card-raised ground, line-strong border, text-primary; hover #2a2a2f. Disabled at 45% opacity.
- **White / Blue variants:** declared in the shell (white on ground text; button-blue with white text) but unused on current screens.

### Tags
- **Style:** Geist Mono 500 11px, 5px radius, 2px 7px, card-raised ground, secondary text.
- **Variants:** ok (green tint), bad (red tint), warn (amber tint), blue (16% blue ground, link-blue text, "rule only" coverage), hollow (transparent with inset line-strong hairline, "never tested" coverage).
- **Verdict pill:** same tint logic, mono 600 13px, full pill, 4px 10px.

### Chips (formula)
Field names in the formula well: Geist 12px, 6px radius, card-raised with line-strong border. The computed target chip takes a 50% blue border and link-blue text. Operators stay mono, muted.

### Cards / Panels
- **Corner Style:** 14px. **Background:** card. **Border:** 1px line. **Shadow:** none.
- **Panel header:** 14px 18px, icon + 14px 600 title + mono muted meta pushed right, 1px line below. Body 14px 18px 16px.

### Navigation
Rail on side ground. Items 8px 10px, 8px radius, secondary text; hover card ground; current card-raised with primary text. Counts in a mono 11px pill (5px radius). Footer states the machine is local.

### Tick Meter (signature)
32 equal segments in a grid, 2px gaps, 10px tall, 1px radius. Segment states: on (mark-blue), part (blue 45%), gap (transparent with hairline), bad (red), warn (amber), empty (tick-off). Proportional fill; when parts sum to the total the last part absorbs rounding so the meter reads full; otherwise empty cells show what remains (budget). Used in meter cards, checkpoint rows and the rule check box. A legend of 8px squares (2px radius) in mono 11px follows.

### Meter Card
Card, 16px 18px: header text with an icon right, Figure total with unit, tick meter, one 12px muted line with bold secondary counts.

### Split Compare (signature)
Two captured screens stacked in a white frame (10px radius, line-strong border, 4:1 band); the top one clipped at a CSS variable split. A 2px ground-coloured bar and a 36px ground-coloured round knob with the diff icon mark the split; an invisible full-size range input drives it (ew-resize). Legacy/Rebuilt labels are ground pills at the top corners. The changed field is outlined red with halo; equal fields blue. A caption below gives before and after in mono with the after value in red text.

### Field Strips
Alternative view via a segmented control (ground well, 8px radius; pressed option card-raised): one 6:1 white strip per app at a shared scale, 8px radius, inset hairline outline, 72px caption column.

### Slide to Validate
42px pill track (card-raised, line-strong border) with centred secondary label; a 32px text-primary knob carrying an arrow, 4px inset; a green 18% fill follows it. Release past 85% validates, otherwise it springs back (.2s ease-out). Enter or Space validates. Paired with a default Reject button in the activity footer.

### Activity Timeline
Ordered steps, 20px circular icon (card-raised; icon coloured by result), 1px line-strong connector, 13px 600 title, muted time. Facts as a card-ground box, 10px radius, 74px key column. Frame thumbs: 150px white crops at 10:3 with a 1.5px blue mark.

### Banner
10px radius, 10px 12px, tinted at 10% by status with the matching light text and an icon.

## Do's and Don'ts

### Do:
- **Do** show the whole extent before the exception: every rule, every field, every checkpoint as a 32-segment tick meter.
- **Do** set values, ids and counts in Geist Mono with tabular numerals.
- **Do** lift with a tonal step and a 1px line (card #19191c on 1px #26262b).
- **Do** use the hollow tag and hollow tick for never-tested coverage, and the blue tag for rule-only coverage.
- **Do** keep radii on the ladder: 14px cards, 10px inset boxes, 8px controls, 5px tags.

### Don't:
- **Don't** use green, red or amber for anything but a result or review state.
- **Don't** colour a coverage gap red.
- **Don't** add drop shadows or gradients to surfaces.
- **Don't** use white grounds outside captured screen evidence.
- **Don't** build rows of same-size KPI cards with charts that have nothing behind them; meters carry the real counts and their breakdown.
