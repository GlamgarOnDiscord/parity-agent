# Design rules for migrated screens

Read this before writing a screen. The goal is a modern business tool in the line of Linear, Vercel's dashboard or Stripe's: quiet, dense, precise. Not a generic admin template. Two working screens show every rule applied: `reference/design/record.js` (one record picked from a list) and `reference/design/document.js` (a document with lines and totals).

## What makes a screen look generic, and is refused

- Every field in one long grid, in the legacy order, under one title "Details".
- Cards inside cards, a card per field, borders on everything.
- Big coloured headers, gradients, shadows, emoji, icons that mean nothing.
- Placeholder copy: "Lorem", "Welcome back", "Manage your data easily".
- Centered layouts, giant inputs, 16 px body text, rounded-full buttons.
- Colour used for decoration. Colour means state: the accent for the action and the selection, green, amber and red for status only.

## What a good screen does

1. **One question per screen, answered at the top.** The record list (`kit.ui.picker`) first, then `kit.subtitle()` with the record's name or code, so the header reads "Customers / Donald Easter".
2. **Group by meaning, not by legacy order.** Three to five cards with short nouns as titles: Identity, Contact, Terms, Accounts, Lines, Totals. Fields that belong together sit side by side (amount next to its currency, start next to end).
3. **Key figures first.** When the legacy screen shows totals, balances or limits, put them in `kit.ui.stats([...])` above the cards; they keep their exact labels.
4. **Status as a pill.** Active or inactive, paid, overdue: `kit.ui.pill("Active", "ok")` next to the title, as well as the field itself, which the proof compares.
5. **Lines are a table.** Repeated rows (invoice lines, prices per sales type) are `kit.ui.table`, numbers right-aligned (`num: true`), totals below with `kit.ui.totals`.
6. **Dense and calm.** The kit's sizes are the sizes: 13 px text, 32 px controls, 38 px rows, 12-16 px gaps. Do not add inline styles that change them.
7. **Empty and error states say what to do.** "No customer picked yet: press / to pick one." Never a blank card.
8. **Keyboard first.** `/` focuses the record list (the kit does it); keep the tab order in reading order.

## Hard limits (the proof depends on them)

- Labels and values exactly as the legacy screen shows them, colon included; regrouping never renames.
- Every legacy field stays on the screen, even the dull ones: put them in a last card ("Other").
- No value written in code: everything comes from `kit.data` and `kit.record`.
