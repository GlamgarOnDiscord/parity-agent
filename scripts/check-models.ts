// One real call per model, to prove access and record the true request shapes. Costs a few cents.
import { z } from "zod";
import { loadConfig } from "../src/config";
import { createModels } from "../src/models";
import { Ledger } from "../src/models/ledger";
import { openDb } from "../src/store/db";

const config = loadConfig();
const ledger = new Ledger(openDb(config.PARITY_DB));
const models = createModels(config, ledger);
const runId = `check-${new Date().toISOString().replace(/[:.]/g, "-")}`;

// A small legacy-style screen: a "Total" field holding 69.21 and a Save button.
const png = await Bun.file(new URL("./sample-field.png", import.meta.url)).bytes();
const image = `data:image/png;base64,${Buffer.from(png).toString("base64")}` as const;

async function check(name: string, fn: () => Promise<unknown>) {
  try {
    const out = await fn();
    console.log(`ok   ${name}`, JSON.stringify(out).slice(0, 300));
  } catch (error) {
    console.log(`FAIL ${name}`, String(error).slice(0, 400));
  }
}

const Label = z.object({ label: z.string(), kind: z.enum(["input", "button", "text", "other"]) });

await check(
  "structured (muse-spark)",
  async () =>
    (
      await models.structured.generate({
        schema: Label,
        prompt: "Name this UI element.",
        images: [image],
        runId,
      })
    ).value,
);
await check(
  "hard (muse-wonder)",
  async () =>
    (await models.hard.generate({ schema: Label, prompt: "Name this UI element.", images: [image], runId }))
      .value,
);
if (models.open) {
  await check(
    "open weights (baseten)",
    async () =>
      (await models.open?.generate({ schema: Label, prompt: "Name a typical invoice field.", runId }))?.value,
  );
} else {
  console.log("skip open weights: BASETEN_API_KEY not set");
}
await check(
  "segment (sam)",
  async () => (await models.segment.segment({ image, phrase: "button", runId })).raw,
);
await check("computer (muse-spark)", async () => {
  const step = await models.computer.step({
    instruction: "Click inside the text field.",
    screenshot: image,
    runId,
  });
  return { actions: step.actions, text: step.text, safety: step.safetyChecks };
});
const audio = Bun.file(new URL("./sample-voice.wav", import.meta.url));
if (await audio.exists()) {
  await check(
    "transcribe",
    async () =>
      (
        await models.transcribe.transcribe({
          audio,
          filename: "sample-voice.wav",
          durationSeconds: 4.4,
          runId,
        })
      ).text,
  );
} else {
  console.log("skip transcribe: scripts/sample-voice.wav missing");
}

const total = ledger.total(runId);
console.log(
  `\n${total.calls} calls, $${total.costUsd.toFixed(4)}, ${total.sentBytes} bytes sent (run ${runId})`,
);
