import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import type { Screen } from "../fields/types";
import type { DataUrl, ModelClients } from "../models/types";
import { parseSam, type SamObject } from "./sam";
import { durationOf, extractAudio, keyFrames, speechSegments } from "./video";

export interface CapturedFrame {
  t: number;
  path: string;
  screen: Screen;
  /** UI elements found by SAM 3.1, for overlays and to place fields precisely. */
  objects: SamObject[];
}

export interface TranscriptLine {
  start: number;
  end: number;
  text: string;
}

export interface Capture {
  video: string;
  duration: number;
  frames: CapturedFrame[];
  transcript: TranscriptLine[];
}

const ReadScreen = z.object({
  title: z.string().describe("The window or page title, or what the screen is for"),
  fields: z
    .array(
      z.object({
        label: z.string().describe("The label shown next to the value, exactly as written"),
        value: z.string().describe("The value exactly as displayed, empty if the field is empty"),
        box: z
          .object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() })
          .describe("Where the value is, as fractions of the image width and height, origin top-left"),
      }),
    )
    .max(200),
});

const READ_PROMPT = `This is one screen of a business application, captured from a screen recording.
List every labelled field you can see with its value, exactly as displayed: keep currency symbols, separators and
decimals as shown, and use an empty value for an empty field. Include computed or read-only values (totals, taxes,
balances). Do not invent fields that are not visible and do not correct anything.`;

const asDataUrl = async (path: string): Promise<DataUrl> =>
  `data:image/png;base64,${Buffer.from(await Bun.file(path).arrayBuffer()).toString("base64")}`;

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "field";

/**
 * Turn a screen recording into frames with fields and a timed transcript. Every model call goes through the
 * ledger; the result is cached in `outDir/capture.json`, so a capture is paid for once.
 */
export async function capture(
  video: string,
  outDir: string,
  models: ModelClients,
  options: { runId?: string; sam?: string[] } = {},
): Promise<Capture> {
  const cacheFile = join(outDir, "capture.json");
  if (existsSync(cacheFile)) return (await Bun.file(cacheFile).json()) as Capture;
  mkdirSync(outDir, { recursive: true });

  const duration = await durationOf(video);
  const frames = await keyFrames(video, join(outDir, "frames"));

  const transcript: TranscriptLine[] = [];
  const audio = join(outDir, "audio.wav");
  if (await extractAudio(video, audio)) {
    for (const [i, seg] of (await speechSegments(audio, duration)).entries()) {
      const piece = join(outDir, `speech-${String(i).padStart(3, "0")}.wav`);
      await extractAudio(video, piece, seg.start, seg.end - seg.start);
      const { text } = await models.transcribe.transcribe({
        audio: Bun.file(piece),
        filename: `speech-${i}.wav`,
        durationSeconds: seg.end - seg.start,
        runId: options.runId,
      });
      if (text.trim()) transcript.push({ start: seg.start, end: seg.end, text: text.trim() });
    }
  }

  const captured: CapturedFrame[] = [];
  for (const [i, frame] of frames.entries()) {
    const image = await asDataUrl(frame.path);
    const { value } = await models.structured.generate({
      schema: ReadScreen,
      prompt: READ_PROMPT,
      images: [image],
      runId: options.runId,
    });
    const seen = new Map<string, number>();
    const screen: Screen = {
      id: `frame-${i + 1}`,
      app: "captured",
      title: value.title,
      fields: value.fields.map((f) => {
        const n = (seen.get(f.label) ?? 0) + 1;
        seen.set(f.label, n);
        return {
          id: n === 1 ? slug(f.label) : `${slug(f.label)}-${n}`,
          label: f.label,
          value: f.value,
          box: f.box,
        };
      }),
    };
    const objects: SamObject[] = [];
    for (const phrase of options.sam ?? []) {
      const { raw } = await models.segment.segment({ image, phrase, runId: options.runId });
      objects.push(...parseSam(raw).map((o) => ({ ...o, id: objects.length + o.id })));
    }
    captured.push({ t: frame.t, path: frame.path, screen, objects });
  }

  const result: Capture = { video, duration, frames: captured, transcript };
  await Bun.write(cacheFile, JSON.stringify(result, null, 2));
  return result;
}
