import { z } from "zod";

const Text = z.string().max(256);

export const FieldSchema = z.object({
  id: z.string().min(1).max(128),
  label: Text,
  value: Text,
  kind: z.enum(["money", "number", "percent", "date", "bool", "text"]).optional(),
  box: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }).optional(),
  group: Text.optional(),
});

export const ScreenSchema = z.object({
  id: z.string().min(1).max(128),
  app: Text,
  title: Text.optional(),
  fields: z.array(FieldSchema).max(500),
});

/** One step a user takes. Targets are field labels, so the same scenario runs on both apps. */
export const StepSchema = z.discriminatedUnion("do", [
  z.object({
    do: z.literal("open"),
    // A path on the app under test only: never an absolute URL, a protocol-relative URL or a backslash.
    path: Text.regex(
      /^\/(?![/\\])[^\\]*$/,
      "path must be relative to the app, starting with a single /",
    ).default("/"),
  }),
  z.object({ do: z.literal("fill"), field: Text, value: Text }),
  z.object({ do: z.literal("click"), target: Text }),
  z.object({ do: z.literal("check"), screen: Text, note: Text.optional() }),
]);

/**
 * How the reference app differs in reaching the same screen: steps it needs first (logging in) and where a path of
 * the scenario lives on it. The scenario itself stays the same for both apps.
 */
export const AdapterSchema = z.object({
  prelude: z
    .array(StepSchema)
    .max(50)
    .refine((steps) => steps.every((s) => s.do !== "check"), "a prelude has no check step")
    .default([]),
  paths: z.record(z.string().max(256), Text.regex(/^\/(?![/\\])[^\\]*$/)).default({}),
});

export const ScenarioSchema = z.object({
  id: z.string().min(1).max(128),
  name: Text,
  steps: z.array(StepSchema).min(1).max(500),
});

/** A recorded checkpoint: the fields a screen showed at a `check` step. */
export const CheckpointSchema = z.object({
  scenario: z.string(),
  step: z.number().int().nonnegative(),
  screen: ScreenSchema,
});

/** The proof: what the reference app did, and what is known to be noise. Versioned, plain JSON. */
export const ProofSchema = z.object({
  format: z.literal("parity-proof"),
  version: z.literal(1),
  createdAt: z.string(),
  reference: z.object({
    app: Text,
    source: z.enum(["replay", "capture", "manual"]),
    adapter: AdapterSchema.optional(),
  }),
  scenarios: z.array(ScenarioSchema).max(200),
  checkpoints: z.array(CheckpointSchema).max(5000),
  /** Per checkpoint screen: legacy field id to rebuilt field id, confirmed by a person. */
  mappings: z.record(z.string(), z.record(z.string(), z.string())).default({}),
  /** Field labels that change on every run of the same app (timestamps, generated ids). */
  volatile: z.array(Text).default([]),
});

export type Step = z.infer<typeof StepSchema>;
export type Scenario = z.infer<typeof ScenarioSchema>;
export type Checkpoint = z.infer<typeof CheckpointSchema>;
export type Proof = z.infer<typeof ProofSchema>;
export type Adapter = z.infer<typeof AdapterSchema>;
