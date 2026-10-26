import { z } from "zod";
import type { Screen } from "../fields/types";
import type { DataUrl, ModelClients } from "../models/types";
import type { Proof, Step } from "../proof/schema";
import type { Capture } from "./capture";

/** A transition that changes more fields than this at once was computed by the app, not typed by the user. */
const TYPED_AT_ONCE = 2;

const Pressed = z.object({
  button: z.string().describe("The exact text of the button or menu item the user activated"),
});

const asDataUrl = async (path: string): Promise<DataUrl> =>
  `data:image/png;base64,${Buffer.from(await Bun.file(path).arrayBuffer()).toString("base64")}`;

function changes(before: Screen, after: Screen) {
  const prev = new Map(before.fields.map((f) => [f.label, f.value]));
  return after.fields.filter((f) => (prev.get(f.label) ?? "") !== f.value);
}

/**
 * Turn a capture into a replayable proof. Typed values become `fill` steps, a burst of computed values becomes
 * a `click` on the button the model reads between the two frames, and every burst becomes a checkpoint whose
 * expected fields are the frame as captured. The legacy app is never replayed (docs/decisions.md D3).
 */
export async function proofFromCapture(
  c: Capture,
  models: ModelClients,
  options: { id: string; name: string; app: string; runId?: string },
): Promise<Proof> {
  const steps: Step[] = [{ do: "open", path: "/" }];
  const checkpoints: Proof["checkpoints"] = [];
  const typed = new Set<string>();

  for (let i = 1; i < c.frames.length; i++) {
    const before = c.frames[i - 1];
    const after = c.frames[i];
    if (!before || !after) continue;
    const changed = changes(before.screen, after.screen);
    if (changed.length === 0) continue;
    const burst = changed.length > TYPED_AT_ONCE;
    if (!burst) {
      for (const f of changed) {
        steps.push({ do: "fill", field: f.label, value: f.value });
        typed.add(f.label);
      }
      continue;
    }
    // Inputs typed in the same transition as the computation are filled first.
    const computed = changed.filter((f) => !typed.has(f.label));
    const { value } = await models.structured.generate({
      schema: Pressed,
      prompt: `Two consecutive frames of a business application. Between them, these fields changed: ${computed
        .map((f) => f.label)
        .join(", ")}. Which button or menu item did the user activate? Give its text exactly as shown.`,
      images: [await asDataUrl(before.path), await asDataUrl(after.path)],
      runId: options.runId,
    });
    steps.push({ do: "click", target: value.button });
    steps.push({ do: "check", screen: `frame-${i + 1}`, note: `after ${value.button}` });
    checkpoints.push({
      scenario: options.id,
      step: steps.length - 1,
      screen: { ...after.screen, id: `frame-${i + 1}`, app: options.app },
    });
  }

  const last = c.frames.at(-1);
  if (checkpoints.length === 0 && last) {
    steps.push({ do: "check", screen: last.screen.id });
    checkpoints.push({
      scenario: options.id,
      step: steps.length - 1,
      screen: { ...last.screen, app: options.app },
    });
  }

  return {
    format: "parity-proof",
    version: 1,
    createdAt: new Date().toISOString(),
    reference: { app: options.app, source: "capture" },
    scenarios: [{ id: options.id, name: options.name, steps }],
    checkpoints,
    mappings: {},
    volatile: [],
  };
}
