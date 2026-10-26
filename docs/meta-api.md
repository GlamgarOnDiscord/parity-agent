# Meta Model API: formats verified on real calls

Verified 2026-10-26 with `bun run models:check` (5 calls, $0.04). Base URL `https://api.meta.ai/v1`, `Authorization: Bearer $MODEL_API_KEY`.

| model                         | how Parity calls it                                                                                                         | verified response                                                                                                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `muse-spark-1.3`              | AI SDK, OpenAI-compatible provider, `generateText` + `Output.object` (Zod); images as `file` parts with an image media type | Valid JSON object; reads "Total" and "69.21" from a 320x120 screenshot for $0.002                                                                                                       |
| `muse-wonder-1.0`             | same client, `hard` role                                                                                                    | Valid JSON object                                                                                                                                                                       |
| `sam-3.1` | OpenAI SDK, `responses.create`, `input_text` (a short noun phrase) + `input_image` | `output_text` with special tokens, one box and one mask per object: `<\|box;x1=90;y1=70;x2=190;y2=100;w=320;h=120\|><\|mask;x=0;y=0;data=...\|>`. Empty when nothing matches ("text field" found nothing, "button" found the Save button exactly) |
| `muse-spark-1.3` computer use | OpenAI SDK, `responses.create`, `tools: [{ type: "computer" }]`                                                             | A `computer_call` item with an **`actions` array** (not a single `action`), `call_id`, `pending_safety_checks` and a `meta_safety_replay_receipt`. The first call asks for a screenshot |
| `muse-voice-transcribe-1.0`   | `POST /asr/transcribe`, multipart: a JSON part `request` = `{ model, audioEncoding: "WAV" }` and a part `audio`             | `{ transcript, audioDurationMs, turns, sessionId }`. WAV must be mono s16le at 16000 or 24000 Hz; 22050 Hz is refused                                                                   |

Not verified yet: Muse Spark Open on Baseten (`BASETEN_API_KEY` not set), Muse Code (`muse exec`, not installed).

Structured outputs are strict: every property of the JSON schema must be listed as required. Use `.nullable()` in Zod for fields that may be absent, never `.optional()` (verified 2026-10-26, 400 "'required' is required to be supplied").
