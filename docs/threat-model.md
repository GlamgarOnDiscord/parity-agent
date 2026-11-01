# Threat model

What Parity protects, from whom, and what it leaves to the operator. Written after the security pass of 2026-11-01 over the whole repository; each mitigation names the code that holds it, and each one with a test says so.

## What Parity holds

| asset | where | why it matters |
|---|---|---|
| Meta and Baseten API keys | `.env`, read into the process | spend, and the operator's account |
| The local server token and session | printed at launch, a cookie | starts paid repairs, reads every run |
| Recordings, screenshots, migrated records | `recordings/`, `runs/`, `generated/`, never committed | the legacy app's business data, often customer data |
| The proof | `*.proof.json`, committed by the operator | what "the same" means; changing it silently hides a regression |
| The verdict | exit code, report, pull-request comment | a reviewer merges on it |

## Who it is protected from

1. **The app under test.** Its screens, labels and values are untrusted: a legacy app can be compromised, and in a pull request the app is whatever the pull request makes it.
2. **The models.** Muse Code is a coding agent with a shell in its workspace, Muse Spark computer use clicks in a real browser, and both act on text that came from the app.
3. **Web pages the operator visits** while Parity runs on 127.0.0.1 (cross-site requests, DNS rebinding).
4. **Contributors** who open pull requests on a repository that uses the Parity action.

Out of scope: a local user or process with the operator's own rights (it can read `.env` anyway), and the security of the legacy app itself.

## Mitigations

### Nothing leaves the machine unless it is sent

- The server binds 127.0.0.1 only (`src/server/index.ts`); replay, diff and report make no network call, checked with the network cut in CI (`scripts/ci-offline.sh`, job `offline`).
- Every model call goes through the `Ledger`: role, model, cost, bytes sent; errors are redacted of keys and bearer tokens (`src/models/ledger.ts`, test `redact`).
- A budget stops calls once spent. A value that is not a plain number of dollars is now refused instead of silently disabling the cap (`budgetFrom`, test `budget`).

### The browser can reach the app and nothing else

- Parity launches Chrome with a throwaway profile and a dead-end proxy: only the app's host and port bypass it, so other origins, other ports and WebSockets fail; WebRTC may not use unproxied UDP; popups are closed; `open` steps stay on the app's origin; `file:` is refused (`src/drivers/browser.ts`, tests in `test/trust.test.ts` and `test/security.test.ts`).
- Exploration refuses a browser Parity did not launch, acknowledges a safety check only for an app on loopback and only the code the operator named, and lists every acknowledged action (`src/explore/explore.ts`).
- The default driver stays the launched one ([decisions.md](decisions.md) D5): a Chrome attached over CDP is not confined, and during the benchmark it called a Google service on its own.

### The local server answers only its own pages

- A Host allowlist (DNS rebinding) and an Origin check on every request; `/api/*` needs the bearer token or the session cookie; POSTs must be JSON, which a cross-site form cannot send (`src/server/app.ts`, tests `local API`).
- The launch key works once and becomes an HttpOnly, SameSite=Strict cookie, now limited to 12 hours, checked by the server as well as by the browser. Run and evidence names are checked by pattern and by containment.
- Every server page escapes what it prints with one shared escaper (`src/server/ui.ts`); the standalone report has its own escaper and accepts PNG data URLs only (`src/report/report.ts`).

### Text from the app stays data

- **In prompts.** Every label, value, title, selector, row group and recorded action read from the app goes into Muse Code prompts through `code()` (`src/models/prompt-text.ts`): one line, inside a code span whose fence is longer than any backtick in the value, so a value cannot close its span and write instructions after it. Applied to the spec, the repair prompt, the fuzz table and the migration prompt (test `prompt text`). New in this pass. The rules' own titles and statements stay prose on one line (`line()`): they are written by Muse Spark and accepted by the expert before any build. A code span marks text as data; it does not make a model ignore it, which is why the agent also never gets Parity's secrets (below).
- **In pull-request comments.** `cell()` keeps a value on one line and out of table, HTML and link syntax, and now also out of mentions, issue references and bare links (`src/report/summary.ts`, test `pull-request summary`). New in this pass.
- **In exported tests.** Playwright code is built with `JSON.stringify` and every JavaScript line terminator is stripped (`src/export/playwright.ts`).
- **In speech.** The narration text reaches the speech synthesizer through an environment variable, never a command line (`src/capture/speak.ts`).

### The coding agent works with less than Parity has

- Muse Code reads its prompt from a file and its key from stdin, never from argv. It now gets a minimal environment: paths, home, temp, locale, proxy and certificates, and the browser settings its Parity MCP server needs. API keys, the server token, CI tokens and any CDP address are not in it, so the Parity MCP server it starts always launches its own confined Chrome (`museEnv`, test `Muse Code environment`). New in this pass; not yet exercised on a paid run.
- The model is always passed explicitly and the run's usage report is checked: a Contributor model fails the run.
- The workspace is staged back file by file: only regular, non-linked web files through checked descriptors; migration never writes through a link Muse Code left and restores the files it owns after each run (`src/rebuild/rebuild.ts`, `src/migrate/migrate.ts`).
- The staged app server runs with `PATH` and `PORT` only.
- The MCP tools never write project files. `prove` replays the proof's clicks and fills on the app it is given, so that app should be a disposable candidate (the rebuild or a sandbox), never production. Paths must stay inside the project, now checked and opened on the real path so a link cannot lead out (test `MCP paths`); apps must be http(s) on loopback; a repair pins the server to one proof and one app.

### The GitHub Action

- Inputs reach the shell through `env`, never `${{ }}` interpolation; third-party actions are pinned to commit SHAs; the workflow token is `contents: read` by default; the comment step runs on `pull_request` only, where a fork gets a read-only token.
- No model call and no secret in the action.

## Accepted risks

| risk | why it stays | what limits it |
|---|---|---|
| A Muse Code run can spend past the budget | its cost is known only when it ends | max steps and a 15-minute timeout per run; migration estimates before each screen and stops before crossing the budget |
| Chrome's debugging port is open on 127.0.0.1 during a replay | Bun's WebSocket is the transport that works on Windows ([D2](decisions.md)); a pipe transport is the fix | a random port, a throwaway profile, the browser closed after each run; only local processes can reach it |
| The session cookie is sent to other services on 127.0.0.1 | cookies ignore ports | a new session per launch, refused by the server after 12 hours, HttpOnly; the Origin check stops cross-port requests from pages |
| The unpinned MCP server can prove any local port | agents prove apps on whatever port they started | loopback only, read-only replay through the confined browser; repairs use the pinned mode |
| A same-repository pull request runs its own code in the `proof` job with `pull-requests: write` | that is what proving a change means | only collaborators get a write token; forks get a read-only one |
| Muse Code itself may read files outside its workspace | it is the vendor's agent, with its own sandbox | it never sees Parity's keys; nothing it writes outside `public/` and `data/` is staged |

## How to report a problem

Open a private security advisory on the GitHub repository, or an issue without details asking for a contact.
