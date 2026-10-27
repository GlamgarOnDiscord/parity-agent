# Contract for the rebuilt app

Parity replays scenarios on this app and reads its screen, so the app must follow these rules.

1. Plain HTML, CSS and JavaScript in `public/`; no build step, no external network calls, no CDN.
2. Every input has a `<label for>` whose text is exactly the field label in SPEC.md.
3. Every displayed value (computed or read-only) is an `<output data-field="Label">` whose `data-field` is exactly the label in SPEC.md, with the value formatted as SPEC.md shows it.
4. Every button's visible text is exactly the button name in SPEC.md.
5. Computations follow the formulas in SPEC.md to the cent, including where rounding happens.
6. Do not change `server.ts`. Persistence, if needed, uses `POST /api/records/<kind>` and `GET /api/records/<kind>`.
7. Lines of a list or grid (invoice lines, for example) are marked by row: the element that holds a line's values has `data-group="row-1"`, `data-group="row-2"` and so on, numbered from the top among the lines shown, and the row where a new line is typed has `data-group="entry"`. Values outside any line have no `data-group`.
8. Do not add timestamps, random ids or anything that changes between two identical runs unless SPEC.md shows it.
