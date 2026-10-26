# Parity

Rebuilds old business software as a web app and proves the new app behaves the same, field by field; the proof can be replayed after any later change. Built solo for a nine-day AI hackathon (code from 2026-10-26 after the kickoff, submission 2026-11-04 21:00 ET).

## Hard rules

- Everything in this repo is hackathon work; anything made before the kickoff lives elsewhere and is not copied here.
- Meta Model API Standard tier only. Never a `-contributor` model (`loadConfig` refuses them).
- AI never decides equality: matching and diffing are deterministic code. AI captures, proposes and explains.
- Local by default: the server binds 127.0.0.1; every model call goes through the `Ledger` (send log with cost and bytes).
- Drivers and model clients are chosen by config, never imported directly (`docs/decisions.md` D1).
- Never commit `.env`, keys, recordings or anything under `runs/` or `generated/`.
- Code, comments, identifiers and docs in English. Branch + PR for every change.
- Keep RAM low: one server process, one sandbox at a time, containers capped at 1 GB.

## Commands

- `bun install`, `bun run dev` (http://127.0.0.1:8787)
- Before committing: `bun test`, `bun run typecheck`, `bun run check` (`bun run format` to fix)
- `bun run models:check`: one real call per Meta model (needs `.env`, costs cents)

## Layout

- `src/config.ts`: env schema (Zod)
- `src/models/`: `ModelClient` roles (structured, hard, open, computer, segment, transcribe), pricing, ledger
- `src/drivers/`: `AppDriver` interface and registry (browser, desktop)
- `src/fields/`: field model, value normalization, screen matching
- `src/server/`: Hono app
- `docs/`: pitch, decisions, sprints (`docs/sprints.md`, milestones S1 to S9 on GitHub)
- `founder/`: product research (board, panel, competitors, plan)
