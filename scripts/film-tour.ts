// Film a narrated tour of a web app, as a person would record one for Parity: parity tour <tour.json> [--out dir]
// The tour lists setup steps (not filmed, such as logging in) and scenes: steps, then what the narrator says over
// the screen they lead to. Windows only: the narration uses the built-in speech synthesizer. No model call.
import { mkdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { z } from "zod";
import { loadConfig } from "../src/config";
import { openBrowser } from "../src/drivers";
import { StepSchema } from "../src/proof/schema";

const Action = StepSchema.refine((s) => s.do !== "check", "a tour has no check step");
const TourSchema = z.object({
  url: z.string().url(),
  setup: z.array(Action).max(50).default([]),
  scenes: z
    .array(
      z.object({
        steps: z.array(Action).max(20),
        say: z.string().max(600),
        seconds: z.number().min(1).max(30),
      }),
    )
    .min(1)
    .max(40),
});

const { values, positionals } = parseArgs({ allowPositionals: true, options: { out: { type: "string" } } });
const file = positionals[0];
if (!file) {
  console.log("usage: parity tour <tour.json> [--out runs/<name>]");
  process.exit(1);
}
const tour = TourSchema.parse(await Bun.file(file).json());
const out = resolve(values.out ?? join("runs", basename(file).replace(/\.tour\.json$|\.json$/, "")));
mkdirSync(out, { recursive: true });

async function run(args: string[]) {
  const proc = Bun.spawn(args, { stdout: "ignore", stderr: "pipe" });
  if ((await proc.exited) !== 0)
    throw new Error(`${args[0]} failed: ${(await new Response(proc.stderr).text()).slice(-300)}`);
}

// Single-quoted PowerShell strings expand nothing; a quote inside is doubled.
const ps = (s: string) => `'${s.replace(/'/g, "''")}'`;
async function speak(text: string, wav: string) {
  await run([
    "powershell.exe",
    "-NoProfile",
    "-Command",
    [
      "Add-Type -AssemblyName System.Speech",
      "$s = New-Object System.Speech.Synthesis.SpeechSynthesizer",
      "$f = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(16000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)",
      `$s.SetOutputToWaveFile(${ps(wav)}, $f)`,
      `$s.Speak(${ps(text)})`,
      "$s.Dispose()",
    ].join("; "),
  ]);
}

const driver = await openBrowser(loadConfig(), { url: tour.url, viewport: { width: 1280, height: 800 } });
const clips: string[] = [];
try {
  await driver.reset();
  for (const step of tour.setup) await driver.perform(step);
  for (const [i, scene] of tour.scenes.entries()) {
    for (const step of scene.steps) await driver.perform(step);
    const png = join(out, `scene-${i}.png`);
    await Bun.write(png, Buffer.from((await driver.screenshot()).split(",")[1] ?? "", "base64"));
    const wav = join(out, `scene-${i}.wav`);
    await speak(scene.say, wav);
    const clip = join(out, `scene-${i}.mp4`);
    const t = String(scene.seconds);
    await run([
      "ffmpeg",
      "-hide_banner",
      "-y",
      "-loop",
      "1",
      "-t",
      t,
      "-i",
      png,
      "-i",
      wav,
      "-af",
      "apad",
      "-t",
      t,
      "-r",
      "10",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-ar",
      "16000",
      "-ac",
      "1",
      clip,
    ]);
    clips.push(clip);
  }
} finally {
  await driver.close();
}
const list = join(out, "clips.txt");
await Bun.write(list, clips.map((c) => `file '${c.replace(/\\/g, "/")}'`).join("\n"));
await run([
  "ffmpeg",
  "-hide_banner",
  "-y",
  "-f",
  "concat",
  "-safe",
  "0",
  "-i",
  list,
  "-c",
  "copy",
  join(out, "recording.mp4"),
]);
console.log(
  `Wrote ${join(out, "recording.mp4")}: ${tour.scenes.length} scenes, ${tour.scenes.reduce((n, s) => n + s.seconds, 0)} s`,
);
