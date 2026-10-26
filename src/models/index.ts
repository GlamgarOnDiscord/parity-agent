import { type Config, requireKey } from "../config";
import type { Ledger } from "./ledger";
import { computerClient, segmentClient, structuredClient, transcribeClient } from "./meta";
import type { ModelClients } from "./types";

/** Every model by role, built from config. Swapping one is a config change (docs/decisions.md D1). */
export function createModels(config: Config, ledger: Ledger): ModelClients {
  const meta = {
    provider: "meta",
    baseURL: config.META_BASE_URL,
    apiKey: requireKey(config.MODEL_API_KEY, "MODEL_API_KEY"),
  };
  const open = config.BASETEN_API_KEY
    ? structuredClient(
        { provider: "baseten", baseURL: config.BASETEN_BASE_URL, apiKey: config.BASETEN_API_KEY },
        config.PARITY_MODEL_OPEN,
        "structured-open",
        ledger,
      )
    : null;
  return {
    structured: structuredClient(meta, config.PARITY_MODEL_STRUCTURED, "structured", ledger),
    hard: structuredClient(meta, config.PARITY_MODEL_HARD, "hard", ledger),
    open,
    computer: computerClient(meta, config.PARITY_MODEL_COMPUTER, ledger),
    segment: segmentClient(meta, config.PARITY_MODEL_SEGMENT, ledger),
    transcribe: transcribeClient(meta, config.PARITY_MODEL_TRANSCRIBE, ledger),
  };
}

export type { ModelClients } from "./types";
