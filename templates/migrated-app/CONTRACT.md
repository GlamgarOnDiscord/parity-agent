# Contract for a migrated screen

Parity replays the legacy app's scenarios on this app and reads its screen, so every screen must follow these rules.

1. A screen is one file, `public/screens/<id>.js`, an ES module that exports `async function render(root, kit)`. Do not edit `server.ts`, `public/app.js`, `public/index.html`, `public/style.css`, `public/screens.json` or anything in `data/`.
2. Build the screen only from `kit.ui` (`card`, `grid`, `field`, `output`, `picker`, `table`, `totals`, `empty`, and `h` for anything else). No external network calls, no CDN, no inline styles that hide a field.
3. Records come from the migrated data, never from code: `await kit.data("<entity>")` lists the records of `data/<entity>.json`, `await kit.record("<entity>", key)` gives one, `kit.value(record, "Label")` reads a field. No price, name, code or rate written into the screen's code.
4. Labels are the legacy labels, exactly, colon included when the legacy screen shows one: an input is `kit.ui.field("Customer Name:", value)`, a value the user cannot type is `kit.ui.output("Total", value)`, a list of records is `kit.ui.picker("Select a customer:", choices, selected, onPick)`.
5. Values are displayed exactly as the legacy screen shows them (thousands separators, decimals, "true"/"false" for check boxes).
6. Lines of a grid are rows of `kit.ui.table`, which marks each line `data-group="row-N"`; a line being typed has `data-group="entry"`.
7. The legacy address of the screen and its query (`kit.query.get("stock_id")`) open the same record the legacy app opens.
8. Nothing that changes between two identical runs: no timestamps, random ids or animation that delays values.
