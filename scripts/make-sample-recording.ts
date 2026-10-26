// Builds a narrated screen recording of the invoice fixture in legacy mode, to test capture without a human
// recording. Windows only (narration uses the built-in speech synthesizer). Output: runs/sample/recording.mp4
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { loadConfig } from "../src/config";
import { openBrowser } from "../src/drivers";
import type { Step } from "../src/proof/schema";
import { serveFixture } from "./fixture-server";

const out = resolve("runs/sample");
mkdirSync(out, { recursive: true });

const scenes: { steps: Exclude<Step, { do: "check" }>[]; say: string; seconds: number }[] = [
  { steps: [{ do: "open", path: "/" }], say: "I open a new invoice.", seconds: 3 },
  {
    steps: [{ do: "fill", field: "Bill to", value: "Nantes Builders" }],
    say: "It is for Nantes Builders, a regular customer.",
    seconds: 4,
  },
  {
    steps: [
      { do: "fill", field: "Item", value: "HW001" },
      { do: "fill", field: "Quantity", value: "3" },
    ],
    say: "Three claw hammers, item H W zero zero one.",
    seconds: 4,
  },
  {
    steps: [{ do: "fill", field: "Deposit", value: "20.00" }],
    say: "They pay a twenty dollar deposit today.",
    seconds: 4,
  },
  {
    steps: [{ do: "click", target: "Compute" }],
    say: "The Quebec tax always goes on top of the federal tax. That is why the total looks a bit odd.",
    seconds: 7,
  },
];

async function run(args: string[]) {
  const proc = Bun.spawn(args, { stdout: "ignore", stderr: "pipe" });
  const code = await proc.exited;
  if (code !== 0)
    throw new Error(`${args[0]} failed: ${(await new Response(proc.stderr).text()).slice(-300)}`);
}

async function speak(text: string, wav: string) {
  const ps = [
    "Add-Type -AssemblyName System.Speech",
    "$s = New-Object System.Speech.Synthesis.SpeechSynthesizer",
    "$f = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(16000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)",
    `$s.SetOutputToWaveFile('${wav.replace(/'/g, "''")}', $f)`,
    `$s.Speak('${text.replace(/'/g, "''")}')`,
    "$s.Dispose()",
  ].join("; ");
  await run(["powershell.exe", "-NoProfile", "-Command", ps]);
}

const fixture = serveFixture(true);
const driver = await openBrowser(loadConfig(), {
  url: `http://127.0.0.1:${fixture.port}/`,
  viewport: { width: 1024, height: 640 },
});
const clips: string[] = [];
try {
  await driver.reset();
  for (const [i, scene] of scenes.entries()) {
    for (const step of scene.steps) await driver.perform(step);
    const png = join(out, `scene-${i}.png`);
    const shot = await driver.screenshot();
    await Bun.write(png, Buffer.from(shot.split(",")[1] ?? "", "base64"));
    const wav = join(out, `scene-${i}.wav`);
    await speak(scene.say, wav);
    const clip = join(out, `scene-${i}.mp4`);
    await run([
      "ffmpeg",
      "-hide_banner",
      "-y",
      "-loop",
      "1",
      "-t",
      String(scene.seconds),
      "-i",
      png,
      "-i",
      wav,
      "-af",
      "apad",
      "-t",
      String(scene.seconds),
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
  fixture.stop(true);
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
  `wrote ${join(out, "recording.mp4")} (${scenes.reduce((s, x) => s + x.seconds, 0)} s, ${scenes.length} scenes)`,
);
