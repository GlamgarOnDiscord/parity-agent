// Record the proof scenario on a rebuilt app, one screenshot per step, and put it side by side with the
// legacy recording: bun run record:replay [run] (defaults to runs/vs3). No model call.
import { mkdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { loadConfig } from "../src/config";
import { openBrowser } from "../src/drivers";
import { ProofSchema } from "../src/proof/schema";
import { startApp } from "../src/rebuild/rebuild";

const run = process.argv[2] ?? "runs/vs3";
const name = basename(resolve(run));
const out = resolve(run, "replay");
mkdirSync(out, { recursive: true });
const proof = ProofSchema.parse(await Bun.file(join(run, "proof.json")).json());
const app = await startApp(resolve("generated", name, "app"));
const driver = await openBrowser(loadConfig(), { url: app.url, viewport: { width: 1280, height: 800 } });

async function exec(args: string[]) {
  const p = Bun.spawn(args, { stdout: "ignore", stderr: "pipe" });
  if ((await p.exited) !== 0) throw new Error((await new Response(p.stderr).text()).slice(-400));
}

const shots: string[] = [];
try {
  await driver.reset();
  let n = 0;
  const snap = async () => {
    const file = join(out, `step-${String(++n).padStart(2, "0")}.png`);
    await Bun.write(file, Buffer.from((await driver.screenshot()).split(",")[1] ?? "", "base64"));
    shots.push(file);
  };
  for (const step of proof.scenarios[0]?.steps ?? []) {
    if (step.do === "check") continue;
    await driver.perform(step);
    if (step.do === "open" || step.do === "click" || (step.do === "fill" && /qty|quantity/i.test(step.field)))
      await snap();
  }
} finally {
  await driver.close();
  app.stop();
}
console.log(`${shots.length} screenshots in ${out}`);

// Same rhythm as the legacy recording: empty invoice, line typed, totals, second line typed, totals.
const legacy = resolve(run, "recording.mp4");
const durations = [4, 9, 8, 5, 6];
const list = join(out, "frames.txt");
await Bun.write(
  list,
  `${shots.map((s, i) => `file '${s.replaceAll("\\", "/")}'\nduration ${durations[i] ?? 4}`).join("\n")}\nfile '${shots.at(-1)?.replaceAll("\\", "/")}'\n`,
);
const rebuilt = join(out, "rebuilt.mp4");
await exec([
  "ffmpeg",
  "-hide_banner",
  "-y",
  "-f",
  "concat",
  "-safe",
  "0",
  "-i",
  list,
  "-vf",
  "fps=10,format=yuv420p,scale=1280:800",
  "-c:v",
  "libx264",
  rebuilt,
]);
const font = "C\\:/Windows/Fonts/arialbd.ttf";
const label = (text: string) =>
  `scale=960:600,pad=960:656:0:0:color=0x0B0D12,drawtext=fontfile='${font}':text='${text}':x=24:y=616:fontsize=26:fontcolor=white`;
await exec([
  "ffmpeg",
  "-hide_banner",
  "-y",
  "-i",
  legacy,
  "-i",
  rebuilt,
  "-filter_complex",
  `[0:v]${label("Legacy  Virtual Salesman 3 (Windows, 2006)")}[l];[1:v]${label("Rebuilt by Muse Code  proved by Parity")}[r];[l][r]hstack=inputs=2[v]`,
  "-map",
  "[v]",
  "-map",
  "0:a?",
  "-shortest",
  "-c:v",
  "libx264",
  "-pix_fmt",
  "yuv420p",
  "-c:a",
  "aac",
  join(run, "side-by-side.mp4"),
]);
console.log(`wrote ${join(run, "side-by-side.mp4")}`);
