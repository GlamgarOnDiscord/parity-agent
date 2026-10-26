# Decisions

## D1. Swappable drivers and model clients (2026-10-26)

Benchmarks come later. Until then, nothing in the pipeline depends on a specific browser driver or model SDK.

**Browser driver.** Replay code talks to a `BrowserDriver` interface (open, act, read fields, screenshot, close). Implementations:

| driver                            | status                                                              |
| --------------------------------- | ------------------------------------------------------------------- |
| Playwright on Chromium            | default                                                             |
| Playwright over CDP on Lightpanda | to benchmark (vendor claims about 10x speed and memory, unverified) |
| Puppeteer / raw CDP               | to benchmark                                                        |

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
