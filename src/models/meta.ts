import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, Output } from "ai";
import OpenAI from "openai";
import { z } from "zod";
import type { Ledger, LoggedCall } from "./ledger";
import type {
  ComputerAction,
  ComputerClient,
  ComputerRequest,
  ComputerStep,
  SegmentClient,
  SegmentRequest,
  StructuredClient,
  StructuredRequest,
  TranscribeClient,
  TranscribeRequest,
} from "./types";

interface Endpoint {
  provider: string;
  baseURL: string;
  apiKey: string;
}

const bytesOf = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).length;

async function timed<T>(fn: () => Promise<T>): Promise<{ value?: T; error?: unknown; ms: number }> {
  const start = performance.now();
  try {
    return { value: await fn(), ms: Math.round(performance.now() - start) };
  } catch (error) {
    return { error, ms: Math.round(performance.now() - start) };
  }
}

/** Structured output through the AI SDK, on any OpenAI-compatible endpoint (Meta API, Baseten). */
export function structuredClient(
  endpoint: Endpoint,
  model: string,
  role: string,
  ledger: Ledger,
): StructuredClient {
  const provider = createOpenAICompatible({
    name: endpoint.provider,
    baseURL: endpoint.baseURL,
    apiKey: endpoint.apiKey,
    includeUsage: true,
    supportsStructuredOutputs: true,
  });
  return {
    provider: endpoint.provider,
    model,
    async generate<T>(req: StructuredRequest<T>) {
      const content = [
        { type: "text" as const, text: req.prompt },
        ...(req.images ?? []).map((image) => ({
          type: "file" as const,
          data: image,
          mediaType: /^data:(image\/[\w.+-]+);/.exec(image)?.[1] ?? "image/png",
        })),
      ];
      const r = await timed(() =>
        generateText({
          model: provider.chatModel(model),
          system: req.system,
          messages: [{ role: "user", content }],
          output: Output.object({ schema: req.schema }),
        }),
      );
      const call = ledger.record({
        runId: req.runId,
        role,
        provider: endpoint.provider,
        model,
        usage: { inputTokens: r.value?.usage.inputTokens, outputTokens: r.value?.usage.outputTokens },
        sentBytes: bytesOf({ system: req.system, content }),
        durationMs: r.ms,
        ok: !r.error,
        error: r.error ? String(r.error) : undefined,
      });
      if (r.error || !r.value) throw r.error ?? new Error("no response");
      return { value: r.value.output as T, call };
    },
  };
}

function openai(endpoint: Endpoint) {
  return new OpenAI({ baseURL: endpoint.baseURL, apiKey: endpoint.apiKey });
}

/** SAM 3.1 on the Responses API. Returns the special-token text as is. */
export function segmentClient(endpoint: Endpoint, model: string, ledger: Ledger): SegmentClient {
  const client = openai(endpoint);
  return {
    async segment(req: SegmentRequest) {
      const input = [
        {
          role: "user" as const,
          content: [
            { type: "input_text" as const, text: req.phrase },
            { type: "input_image" as const, image_url: req.image, detail: "auto" as const },
          ],
        },
      ];
      const r = await timed(() => client.responses.create({ model, input }));
      const call = ledger.record({
        runId: req.runId,
        role: "segment",
        provider: endpoint.provider,
        model,
        usage: { images: 1 },
        sentBytes: bytesOf(input),
        durationMs: r.ms,
        ok: !r.error,
        error: r.error ? String(r.error) : undefined,
      });
      if (r.error || !r.value) throw r.error ?? new Error("no response");
      return { raw: r.value.output_text ?? "", call };
    },
  };
}

const TranscriptBody = z.looseObject({ transcript: z.string(), audioDurationMs: z.number().optional() });

/**
 * Muse Voice Transcribe: POST /asr/transcribe, multipart with a JSON `request` part and an `audio` part.
 * Verified 2026-10-26: WAV must be mono s16le at 16000 or 24000 Hz.
 */
export function transcribeClient(endpoint: Endpoint, model: string, ledger: Ledger): TranscribeClient {
  return {
    async transcribe(req: TranscribeRequest) {
      const form = new FormData();
      form.set(
        "request",
        new Blob([JSON.stringify({ model, audioEncoding: "WAV" })], { type: "application/json" }),
      );
      form.set("audio", req.audio, req.filename);
      const r = await timed(async () => {
        const res = await fetch(`${endpoint.baseURL}/asr/transcribe`, {
          method: "POST",
          headers: { Authorization: `Bearer ${endpoint.apiKey}` },
          body: form,
        });
        if (!res.ok) throw new Error(`transcribe ${res.status}: ${(await res.text()).slice(0, 300)}`);
        return res.json() as Promise<unknown>;
      });
      const body = r.error ? undefined : TranscriptBody.safeParse(r.value);
      const measured = body?.success ? body.data.audioDurationMs : undefined;
      const call = ledger.record({
        runId: req.runId,
        role: "transcribe",
        provider: endpoint.provider,
        model,
        usage: { audioSeconds: measured !== undefined ? measured / 1000 : req.durationSeconds },
        sentBytes: req.audio.size,
        durationMs: r.ms,
        ok: Boolean(body?.success),
        error: r.error ? String(r.error) : body?.success ? undefined : "unexpected transcript shape",
      });
      if (r.error) throw r.error;
      if (!body?.success) {
        throw new Error(`unexpected transcript shape: ${JSON.stringify(r.value).slice(0, 300)}`);
      }
      return { text: body.data.transcript, raw: r.value, call };
    },
  };
}

const ComputerCall = z.looseObject({
  type: z.literal("computer_call"),
  call_id: z.string(),
  // Verified 2026-10-26: Meta returns a list of actions per call, not a single `action`.
  actions: z.array(z.looseObject({ type: z.string() })).default([]),
  meta_safety_replay_receipt: z.string().optional(),
  pending_safety_checks: z
    .array(z.object({ id: z.string(), code: z.string(), message: z.string() }))
    .default([]),
});

/** Muse Spark computer use on the Responses API with the built-in `computer` tool. */
export function computerClient(endpoint: Endpoint, model: string, ledger: Ledger): ComputerClient {
  const client = openai(endpoint);
  return {
    async step(req: ComputerRequest): Promise<ComputerStep> {
      const input = req.previous
        ? [
            {
              type: "computer_call_output",
              call_id: req.previous.callId,
              acknowledged_safety_checks: req.previous.acknowledged ?? [],
              output: { type: "computer_screenshot", image_url: req.screenshot },
            },
          ]
        : [
            {
              role: "user",
              content: [
                { type: "input_text", text: req.instruction ?? "" },
                { type: "input_image", image_url: req.screenshot },
              ],
            },
          ];
      const body = {
        model,
        tools: [{ type: "computer" }],
        input,
        ...(req.previous ? { previous_response_id: req.previous.responseId } : {}),
      };
      // The Meta `computer` tool is not in the OpenAI SDK's tool union, hence the cast.
      const r = await timed(() =>
        client.responses.create(body as unknown as OpenAI.Responses.ResponseCreateParamsNonStreaming),
      );
      const call: LoggedCall = ledger.record({
        runId: req.runId,
        role: "computer",
        provider: endpoint.provider,
        model,
        usage: { inputTokens: r.value?.usage?.input_tokens, outputTokens: r.value?.usage?.output_tokens },
        sentBytes: bytesOf(body),
        durationMs: r.ms,
        ok: !r.error,
        error: r.error ? String(r.error) : undefined,
      });
      if (r.error || !r.value) throw r.error ?? new Error("no response");
      const item = (r.value.output as unknown[]).map((o) => ComputerCall.safeParse(o)).find((p) => p.success);
      if (!item?.success)
        return { responseId: r.value.id, actions: [], safetyChecks: [], text: r.value.output_text, call };
      return {
        responseId: r.value.id,
        callId: item.data.call_id,
        actions: item.data.actions as ComputerAction[],
        safetyReceipt: item.data.meta_safety_replay_receipt,
        safetyChecks: item.data.pending_safety_checks,
        call,
      };
    },
  };
}
