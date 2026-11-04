# Design rules for migrated screens

Read this before writing a screen. The bar is a business tool people would screenshot: the CRM and invoicing work on Dribbble, Behance and Pinterest in 2026 (dark SaaS dashboards, CRM profile pages, modern invoice apps). Quiet, dense, precise, finished. Not a generic admin template. Two working screens show every rule applied: `reference/design/record.js` (one record picked from a list) and `reference/design/document.js` (a document with lines and totals).

## Patterns taken from the references

These recur across the best current CRM and invoicing screens; use them.

- **Identity first.** A record screen opens on `kit.ui.hero({ title, subtitle, pills })`: initials in an accent tile, the record's name in large type, one line under it (company, code, city), status pills on the right. The legacy picker sits just above it, the record name repeats in `kit.subtitle()`.
- **Key figures as tiles.** Two to four numbers the user scans first (credit limit, balance, price, quantity on hand) in `kit.ui.stats([...])`, right under the hero.
- **Two columns.** `kit.ui.split(main, aside)`: the main column holds the editable cards (identity, contact, terms); the side column holds read-only summaries (`kit.ui.details`) such as accounts, classification, dates. Never one long column of every field.
- **Read-only values read as a list.** Values the user does not type (codes, accounts, dates, computed amounts) go in `kit.ui.details(title, fields)`: label left, value right, hairline between rows. Editable values stay inputs in `kit.ui.form`.
- **Documents lead with the amount.** An invoice or order shows its total in the hero or a stat tile, then who it is billed to, then the lines as a table with numbers right-aligned, then the totals block bottom right.
- **One accent, used for meaning.** The accent marks the selected item, the primary action and the identity tile. Green, amber and red only for status. Everything else is greyscale on the dark surface.

## What makes a screen look generic, and is refused

- Every field in one long grid, in the legacy order, under one title "Details".
- Cards inside cards, a card per field, borders on everything.
- Gradient text, rainbow headers, glow on everything, emoji, icons that mean nothing.
- Placeholder copy: "Lorem", "Welcome back", "Manage your data easily".
- Centered layouts, giant inputs, 16 px body text, rounded-full buttons.
- Inline styles that change the kit's sizes, colors or spacing.

## What a good screen does

1. One question per screen, answered at the top: picker, then hero, then stats.
2. Group by meaning, not by legacy order: three to five cards with short nouns as titles (Identity, Contact, Terms, Accounts, Lines, Totals).
3. Fields that belong together sit side by side (amount next to currency, start next to end).
4. Empty and error states say what to do: "No customer picked yet: press / to pick one."
5. Keyboard first: `/` focuses the record list (the kit does it); tab order follows reading order.

## Hard limits (the proof depends on them)

- Labels and values exactly as the legacy screen shows them, colon included; regrouping never renames.
- Every legacy field stays on the screen, even the dull ones: put them in a last card or a side `details` list ("Other").
- No value written in code: everything comes from `kit.data` and `kit.record`.
- The hero and pills are decoration: the same values must also be present as fields.
