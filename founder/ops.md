# Operations: Parity

A one-person open-source project built in 9 days on one laptop. The "daily cycle" is the build loop during the hackathon, then the maintenance loop after it.

## The daily cycle (hackathon, Oct 27 to Nov 4)

1. Read the sprint checklist (`docs/sprints.md` in the private repo) and pick the day's one goal.
2. Start one sandbox only (Wine or FrontAccounting), capped at 1 GB.
3. Build; run tests, typecheck, lint.
4. Run the end-to-end scenario on Virtual Salesman 3; record what broke.
5. Check Meta credit spend on dev.meta.ai Billing; log it.
6. Commit through a branch and PR to the public repo. *(customer sees: the repo)*
7. Post the day's clip on X. *(customer sees)*
8. Stop Docker; note tomorrow's goal.

After the hackathon: triage issues daily, one release a week, reply to every stranger who ran it on their own app. *(customer sees)*

## Suppliers (tools and services)

| input | supplier | price and terms | source |
|---|---|---|---|
| Models: capture, rules, computer use, explanations | Meta Model API | $150 hackathon credits; then $1.25 / $4.25 per M tokens (Spark 1.3) | dev.meta.ai pricing (private repo notes) |
| Open-weight rule extraction | Muse Spark Open on Baseten | hackathon access; post-hackathon price not checked: get a quote | open question |
| Code generation | Muse Code CLI | uses Meta credits | dev.meta.ai docs |
| Repo, CI, releases | GitHub | free for public repos; private CI was blocked by billing earlier, check before relying on Actions | private repo history |
| Sandboxes | Docker Desktop, Wine, Alpine PHP + MariaDB images | free | already running |
| Hosted tier (later) | any cloud VM | estimate $40 a month; get a quote | [cfo-sources.md](cfo-sources.md) |

No price in [numbers.json](numbers.json) changed; the CFO does not need to re-run.

## People

One person: the founder does everything. Hackathon hours are the founder's choice; the plan assumes about 8 focused hours a day, with the internal deadline Nov 4, 20:00 Paris. No wages, so no payroll. After the hackathon: look for a second maintainer (several panel buyers ask for "more than one maintainer" before trusting it).

## Routines

**Start of day (10 min).** Pull, read yesterday's note, check credits, start one sandbox.

**Core loop (each feature).** Write the scenario first, build, replay on VS3, check noise, commit, PR.

**Credit check (daily).** Billing page; if spend is over $100, switch rule extraction to Muse Spark Open and stop new code-generation runs until the demo is recorded.

**Demo recording (Nov 3).** Fresh sandbox, scripted path, three takes, pick the cleanest, never fake a step: every second shown is real.

**Issue from a stranger (after launch).** Thank them, ask for the smallest reproduction, label it, fix or explain within 48 hours, link the fix.

## Tools

GitHub (repo, issues, releases), Bun + TypeScript, Docker, the Meta dashboard for spend, a plain markdown log in the private repo. Nothing paid.

## Licences, permits, rules

- **Open-source licence:** pick before the repo goes public (MIT or Apache-2.0; Apache-2.0 adds a patent grant). Tracked as issue #30 in the private repo.
- **Hackathon rules:** public repo, new work only, Standard tier models, 3-minute video ([private repo `docs/hackathon.md`](https://github.com/GlamgarOnDiscord/parity)).
- **Personal data:** recordings can show customer data. In France and the EU, GDPR applies to whoever processes them; the tool's default must keep recordings local and the README must say so. Demo data stays fictional. Confirm with the [CNIL](https://www.cnil.fr/) guidance before any real customer use.
- **Meta credits terms:** free credits allow content to be used for product improvement (Billing page). Do not send real customer data under free credits.
- **Trademarks:** see [brand.md](brand.md).

Rules change and differ by place; confirm each with the authority or a professional. Not legal advice.

## Risk register

| # | risk | likelihood | impact | plan |
|---|---|---|---|---|
| 1 | Field matching between old and new UI is unreliable | high | high | design it day 1; fall back to explicit field mapping per screen |
| 2 | Noise floods the diff | high | high | volatile-field masking before any other feature; measure false diffs on VS3 and FrontAccounting |
| 3 | Computer-use exploration under Wine is slow or flaky | high | medium | optional; the demo works from the recording alone |
| 4 | Credits run out | medium | high | daily check, $100 alert, cache, Muse Spark Open for bulk |
| 5 | Laptop RAM: sandbox plus dev server plus browser crash | medium | medium | one sandbox at a time, 1 GB cap, stop Docker after use |
| 6 | Muse Code output does not converge to parity | medium | high | pre-defined repair loop with a stop after N tries; show the remaining diff honestly |
| 7 | Demo looks hand-picked | medium | medium | second app (FrontAccounting) the founder did not write |
| 8 | Keploy or Meticulous ships the same idea | medium | medium | lead with any-app, offline, readable proof; ship fast |
| 9 | Founder exhaustion near the deadline | medium | high | internal deadline Nov 4 20:00 Paris; cut list frozen day 3 |
| 10 | Submission form or video upload fails at the last minute | low | high | upload the video by Nov 4 noon; keep a backup link |
