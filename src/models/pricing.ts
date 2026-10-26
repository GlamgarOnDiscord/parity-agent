// Standard-tier prices in USD, from dev.meta.ai pricing (checked 2026-10-20). Recheck before relying on them.
export type Price =
  | { kind: "tokens"; inputPerM: number; outputPerM: number }
  | { kind: "images"; perThousand: number }
  | { kind: "audio-hours"; perHour: number };

const PRICES: Record<string, Price> = {
  "muse-spark-1.3": { kind: "tokens", inputPerM: 1.25, outputPerM: 4.25 },
  "muse-spark-1.2": { kind: "tokens", inputPerM: 1.25, outputPerM: 4.25 },
  "muse-wonder-1.0": { kind: "tokens", inputPerM: 4, outputPerM: 20 },
  "sam-3.1": { kind: "images", perThousand: 2.5 },
  "muse-voice-transcribe-1.0": { kind: "audio-hours", perHour: 0.18 },
};

export interface Usage {
  inputTokens?: number;
  outputTokens?: number;
  images?: number;
  audioSeconds?: number;
}

/** Cost of one call. Unknown models (for example open weights on partner credits) cost 0 and are flagged. */
export function costOf(model: string, usage: Usage): { usd: number; known: boolean } {
  const price = PRICES[model];
  if (!price) return { usd: 0, known: false };
  switch (price.kind) {
    case "tokens":
      return {
        usd:
          ((usage.inputTokens ?? 0) * price.inputPerM + (usage.outputTokens ?? 0) * price.outputPerM) / 1e6,
        known: true,
      };
    case "images":
      return { usd: ((usage.images ?? 0) * price.perThousand) / 1000, known: true };
    case "audio-hours":
      return { usd: ((usage.audioSeconds ?? 0) / 3600) * price.perHour, known: true };
  }
}
