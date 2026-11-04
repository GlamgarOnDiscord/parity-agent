# Design rules for migrated screens

Read this before writing a screen. The bar is a business tool people would screenshot: quiet, dense, precise, finished. The rules come from 134 current CRM, invoicing and back-office references (`docs/design-research.md`); the most useful were shipped products (an Attio-style record page, Midday's transactions, a billing table with status tabs), not concept shots. Two working screens show the rules applied: `reference/design/record.js` (one record picked from a list) and `reference/design/document.js` (a document with lines and totals).

## The app's direction

Every rebuilt app has one visual direction, set on `<html data-direction>` by Parity from the app's domain (or named in `migration.json`). The shell already applies its palette, radius, base size and sidebar; a screen never overrides them. The direction decides what the screen leans on:

| Direction | Fits | Lean on |
|---|---|---|
| `ledger` | ops, monitoring, logistics, tickets | dark, dense rows, bare numbers, charts in grey with one highlighted value |
| `paper` | CRM, contacts, HR, documents | light and airy, a large record name, records that read like a document |
| `counting-house` | invoicing, accounting, stock, ERP | warm sand and rust, the first key figure as the one dark inverse tile, totals large |
| `signal` | B2B admin, analytics, anything else | white and grey, one cobalt accent on the single most important thing |
| `atelier` | booking, education, small shops | a blue sidebar, white content, tinted status pills |
| `night-shift` | premium displays | warm dark, one copper accent with a soft glow |

## Patterns per screen type

**Record (customer, item, supplier).**
- Picker first, then `kit.ui.hero({ title, subtitle, pills })`: initials, the record's name, one meta line (code, terms, city), status pills on the right. The record name repeats in `kit.subtitle()`.
- A facts strip right under it: two to four numbers the user scans first (credit limit, balance, price, on hand) in `kit.ui.stats([...])`. Never four identical tiles as the only idea on the page.
- `kit.ui.split(main, aside)`: editable cards in the main column (Identity, Contact, Terms); read-only values in the side column as `kit.ui.details` label/value rows (accounts, classification, dates). No stacked full-width inputs for values the user does not type.

**Document with lines (invoice, order, quote).**
- Lead with the amount: the total in a stat tile or the hero, then who it is billed to, then the lines.
- Lines as `kit.ui.table`, identifier column first, amounts right-aligned with tabular figures (`num: true`).
- Totals with `kit.ui.totals`, right-aligned under the table, the total last.

**List.** Title, then the table; statuses as pills with a closed set of tones; at most one row tint, for exceptions only.

## Color and type

- One accent, used for meaning: the selected item, the primary action, the identity tile. At most one saturated element per screen; a second filled colored card is a defect.
- Status tones are closed: `ok`, `warn`, `bad`, or none. Map a status word to a tone only when its meaning is clear; an unknown word stays neutral. Time-based statuses keep their age as the legacy screen shows it ("Overdue 58 days").
- Every number in tables, figures and totals is tabular (the kit does it). Sentence case everywhere; uppercase only for tiny group labels.

## Empty and error states

- Inside the real screen: the picker and cards stay, the empty state sits where the data would be.
- Say what is missing and what to do, in one line: "No customer picked yet: press / to pick one." At most two actions.
- A failed load says so and keeps the error text visible (the kit does it).

## Refused: the marks of a generic or AI-made screen

- Every field in one long grid in the legacy order under one title "Details"; cards inside cards; a card per field.
- "Welcome back" headers, upgrade cards, placeholder names (John Doe, Acme), "Lorem", emoji.
- Gradient text, purple-to-blue gradients, glass and glow on data surfaces, neon on every series.
- Four identical stat tiles with an icon and a green "+12%"; more than five status colors in one table.
- Text links "View Edit Delete" repeated on every row; bold 700 body numbers; uppercase buttons.
- Inline styles that change the kit's sizes, colors, radius or spacing: the direction owns them.

## What a good screen does

1. One question per screen, answered at the top: picker, then hero, then figures.
2. Group by meaning, not by legacy order: three to five cards with short nouns as titles (Identity, Contact, Terms, Accounts, Lines, Totals).
3. Fields that belong together sit side by side (amount next to currency, start next to end).
4. Keyboard first: `/` or Ctrl K focuses the record list (the kit does it); tab order follows reading order.

## Hard limits (the proof depends on them)

- Labels and values exactly as the legacy screen shows them, colon included; regrouping never renames.
- Every legacy field stays on the screen, even the dull ones: put them in a last card or a side `details` list ("Other").
- No value written in code: everything comes from `kit.data` and `kit.record`.
- The hero and pills are decoration: the same values must also be present as fields, and they show only values from the record (no fallback words such as "Customer" when a value is blank).
