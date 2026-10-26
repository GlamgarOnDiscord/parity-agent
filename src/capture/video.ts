import { mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

export interface KeyFrame {
  /** Seconds from the start of the recording. */
  t: number;
  path: string;
}

async function run(args: string[]): Promise<string> {
  const proc = Bun.spawn(args, { stdout: "pipe", stderr: "pipe" });
  const [out, err, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (code !== 0) throw new Error(`${args[0]} failed (${code}): ${err.slice(-400)}`);
  return out + err;
}

export async function durationOf(video: string): Promise<number> {
  const out = await run([
    "ffprobe",
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    video,
  ]);
  const seconds = Number.parseFloat(out.trim());
  if (!Number.isFinite(seconds)) throw new Error(`cannot read the duration of ${video}`);
  return seconds;
}

/**
 * Key frames: every frame that differs from the last kept one, by ffmpeg's block-based mpdecimate. Business
 * apps change in small steps (a field filled on a white page), which a global scene score misses.
 */
export async function keyFrames(video: string, outDir: string): Promise<KeyFrame[]> {
  mkdirSync(outDir, { recursive: true });
  const log = await run([
    "ffmpeg",
    "-hide_banner",
    "-y",
    "-i",
    video,
    "-vf",
    "mpdecimate,showinfo",
    "-fps_mode",
    "vfr",
    "-q:v",
    "2",
    join(outDir, "frame-%04d.png"),
  ]);
  const times = [...log.matchAll(/pts_time:([\d.]+)/g)].map((m) => Number.parseFloat(m[1] ?? "0"));
  const files = readdirSync(outDir)
    .filter((f) => /^frame-\d{4}\.png$/.test(f))
    .sort();
  return files.map((f, i) => ({ t: times[i] ?? 0, path: join(outDir, f) }));
}

/** The audio track as mono 16 kHz s16le WAV, the format Muse Voice Transcribe accepts. */
export async function extractAudio(
  video: string,
  out: string,
  start?: number,
  length?: number,
): Promise<boolean> {
  const window =
    start !== undefined && length !== undefined ? ["-ss", String(start), "-t", String(length)] : [];
  try {
    await run([
      "ffmpeg",
      "-hide_banner",
      "-y",
      ...window,
      "-i",
      video,
      "-vn",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-c:a",
      "pcm_s16le",
      out,
    ]);
    return true;
  } catch (error) {
    if (
      String(error).includes("does not contain any stream") ||
      String(error).includes("Output file does not contain")
    ) {
      return false;
    }
    throw error;
  }
}

/** Speech segments, from ffmpeg's silence detection: transcribing each one gives every line a timestamp. */
export async function speechSegments(
  wav: string,
  total: number,
  minSilence = 0.6,
): Promise<{ start: number; end: number }[]> {
  const log = await run([
    "ffmpeg",
    "-hide_banner",
    "-i",
    wav,
    "-af",
    `silencedetect=noise=-35dB:d=${minSilence}`,
    "-f",
    "null",
    "-",
  ]);
  const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number.parseFloat(m[1] ?? "0"));
  const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number.parseFloat(m[1] ?? "0"));
  const segments: { start: number; end: number }[] = [];
  let cursor = 0;
  for (let i = 0; i < starts.length; i++) {
    const silenceStart = starts[i] ?? total;
    if (silenceStart - cursor > 0.3) segments.push({ start: cursor, end: silenceStart });
    cursor = ends[i] ?? total;
  }
  if (total - cursor > 0.3) segments.push({ start: cursor, end: total });
  return segments;
}
