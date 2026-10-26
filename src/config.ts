import { z } from "zod";

const Env = z.object({
  MODEL_API_KEY: z.string().optional(),
  META_BASE_URL: z.url().default("https://api.meta.ai/v1"),
  BASETEN_API_KEY: z.string().optional(),
  BASETEN_BASE_URL: z.url().default("https://inference.baseten.co/v1"),
  PARITY_MODEL_STRUCTURED: z.string().default("muse-spark-1.3"),
  PARITY_MODEL_HARD: z.string().default("muse-wonder-1.0"),
  PARITY_MODEL_COMPUTER: z.string().default("muse-spark-1.3"),
  PARITY_MODEL_SEGMENT: z.string().default("sam-3.1"),
  PARITY_MODEL_TRANSCRIBE: z.string().default("muse-voice-transcribe-1.0"),
  PARITY_MODEL_OPEN: z.string().default("meta-models/muse-spark-open-1026"),
  PARITY_BROWSER: z.enum(["chromium", "lightpanda", "cdp"]).default("chromium"),
  PARITY_CDP_URL: z.string().optional(),
  PARITY_PORT: z.coerce.number().int().positive().default(8787),
  PARITY_DB: z.string().default("runs/parity.sqlite"),
});

export type Config = z.infer<typeof Env>;

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const cleaned = Object.fromEntries(Object.entries(env).filter(([, v]) => v !== undefined && v !== ""));
  const config = Env.parse(cleaned);
  for (const [key, value] of Object.entries(config)) {
    if (key.startsWith("PARITY_MODEL_") && String(value).endsWith("-contributor")) {
      throw new Error(`${key} uses a Contributor model; Parity runs on the Standard tier only`);
    }
  }
  return config;
}

export function requireKey(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} is not set; copy .env.example to .env and fill it`);
  return value;
}
