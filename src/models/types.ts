import type { z } from "zod";
import type { LoggedCall } from "./ledger";

/** A PNG or JPEG data URL. */
export type DataUrl = `data:image/${string};base64,${string}`;

export interface StructuredRequest<T> {
  schema: z.ZodType<T>;
  prompt: string;
  system?: string;
  images?: DataUrl[];
  runId?: string;
  /** Reasoning budget: reading a screen needs little, settling a contradiction a bit more. */
  effort?: "minimal" | "low" | "medium" | "high";
  /** Hard cap on output tokens (reasoning included), to keep each call's cost bounded. */
  maxOutputTokens?: number;
}

/** Text in, validated object out: rule extraction, field labelling, diff explanations. */
export interface StructuredClient {
  readonly provider: string;
  readonly model: string;
  generate<T>(req: StructuredRequest<T>): Promise<{ value: T; call: LoggedCall }>;
}

export interface SegmentRequest {
  image: DataUrl;
  /** A short noun phrase, for example "text field" or "button". */
  phrase: string;
  runId?: string;
}

/** SAM 3.1: boxes and masks for one phrase on one image. The raw text is parsed in the vision stage. */
export interface SegmentClient {
  segment(req: SegmentRequest): Promise<{ raw: string; call: LoggedCall }>;
}

export interface TranscribeRequest {
  audio: Blob;
  filename: string;
  durationSeconds: number;
  runId?: string;
}

export interface TranscribeClient {
  transcribe(req: TranscribeRequest): Promise<{ text: string; raw: unknown; call: LoggedCall }>;
}

export type ComputerAction =
  | { type: "click" | "double_click" | "move"; x: number; y: number; button?: string }
  | { type: "drag"; path: { x: number; y: number }[] }
  | { type: "keypress"; keys: string[] }
  | { type: "type"; text: string }
  | { type: "scroll"; x: number; y: number; scroll_x: number; scroll_y: number }
  | { type: "screenshot" }
  | { type: "wait" };

export interface ComputerStep {
  responseId: string;
  callId?: string;
  /** Actions to execute in order, then answer with one screenshot. */
  actions: ComputerAction[];
  /** Opaque receipt Meta attaches to each computer call; kept with the step for audit. */
  safetyReceipt?: string;
  /** Safety checks the caller must acknowledge or refuse before continuing. */
  safetyChecks: { id: string; code: string; message: string }[];
  /** Final text when the model stops asking for actions. */
  text?: string;
  call: LoggedCall;
}

export interface ComputerRequest {
  instruction?: string;
  screenshot: DataUrl;
  previous?: {
    responseId: string;
    callId: string;
    acknowledged?: { id: string; code: string; message: string }[];
  };
  runId?: string;
}

/** Muse Spark computer use: one screenshot in, one action out. The loop lives in the explorer. */
export interface ComputerClient {
  step(req: ComputerRequest): Promise<ComputerStep>;
}

export interface ModelClients {
  structured: StructuredClient;
  hard: StructuredClient;
  open: StructuredClient | null;
  computer: ComputerClient;
  segment: SegmentClient;
  transcribe: TranscribeClient;
}
