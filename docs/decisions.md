# Decisions

## D1. Swappable drivers and model clients (2026-10-26)

Benchmarks come later. Until then, nothing in the pipeline depends on a specific browser driver or model SDK.

**Browser driver.** Replay code talks to a `BrowserDriver` interface (open, act, read fields, screenshot, close). Implementations:

| driver                                                                | status                                                              |
| --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Chrome started with a throwaway profile, driven by Puppeteer over CDP | default                                                             |
| Lightpanda over CDP (`PARITY_CDP_URL`)                                | to benchmark (vendor claims about 10x speed and memory, unverified) |
| Any CDP browser already running                                       | to benchmark                                                        |

Chosen by config (`PARITY_BROWSER=chromium|lightpanda|cdp`), never by import. Desktop apps use a separate `DesktopDriver` (Xvfb + input events in the Wine sandbox).

**Model clients.** Pipeline stages call a `ModelClient` interface by role, not by SDK:

| role                                       | default implementation                                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| structured text (rules, diff explanations) | Vercel AI SDK, OpenAI-compatible provider on `https://api.meta.ai/v1`, `generateObject` + Zod             |
| computer use (exploration)                 | OpenAI SDK, Responses API with `{"type":"computer"}` (to confirm on day 1 whether the AI SDK supports it) |
| segmentation (SAM 3.1), transcription      | typed `fetch`, responses validated with Zod                                                               |
| open weights                               | same structured-text client pointed at Muse Spark Open on Baseten                                         |

Model id, base URL and implementation per role come from config. Swapping one is a config change plus, at most, one adapter file.

**Benchmark plan (later).** Same scenarios on FrontAccounting and Virtual Salesman 3: wall time per replay, peak RAM, flaky runs out of 20, and for models, cost and accuracy on the 15 hand-observed rules. Results go in `docs/benchmarks.md`; the default changes only if a challenger wins on speed without losing reliability.

## D2. Puppeteer over Bun's own WebSocket instead of Playwright (2026-10-26)

Playwright's launch talks to Chrome over pipes, and its bundled `ws` client never completes the CDP handshake under Bun on Windows (both reproduced: launch timeout, then `connectOverCDP` timeout). Bun's native `WebSocket` reaches the same endpoint instantly. Puppeteer accepts a custom `ConnectionTransport`, so Parity starts Chrome itself on a local debugging port with a throwaway profile and hands Puppeteer a transport built on Bun's `WebSocket`. Behind the `AppDriver` interface nothing else changed. Playwright test export, planned for proven scenarios, only writes text files and does not need the library.

## D3. The legacy reference comes from the recording (2026-10-26)

Replaying an old Windows app automatically needs a desktop driver, a vision loop and a sandbox per run; reading the key frames of the narrated recording gives the same checkpoints for a few cents, once. Proofs therefore take their reference checkpoints from the capture (`reference.source = "capture"`), and automatic replays target only the rebuilt app. A new behavior of the old app is captured by recording it again, not by driving it.
