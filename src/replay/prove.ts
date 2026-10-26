import { diffScreens, type ScreenDiff } from "../diff/diff";
import { detectVolatile } from "../diff/volatile";
import type { AppDriver } from "../drivers/types";
import { matchScreens } from "../fields/match";
import type { Checkpoint, Proof } from "../proof/schema";
import { type OnCheck, replay } from "./replay";

export interface CheckpointResult {
  scenario: string;
  step: number;
  screen: string;
  diff: ScreenDiff;
}

export interface ProveResult {
  volatile: string[];
  checkpoints: CheckpointResult[];
  /** True only when every compared field is equal and nothing is missing. */
  equal: boolean;
}

/**
 * Replay every scenario of the proof on the candidate app, twice: the two runs reveal which fields change on
 * their own (noise), then the first run is compared field by field with the reference checkpoints.
 */
export async function prove(
  proof: Proof,
  candidate: AppDriver,
  options: { onCheck?: OnCheck } = {},
): Promise<ProveResult> {
  const first: Checkpoint[] = [];
  const second: Checkpoint[] = [];
  for (const scenario of proof.scenarios) {
    first.push(...(await replay(candidate, scenario, options.onCheck)));
    second.push(...(await replay(candidate, scenario)));
  }
  const volatile = [
    ...new Set([
      ...proof.volatile,
      ...detectVolatile(
        first.map((c) => c.screen),
        second.map((c) => c.screen),
      ),
    ]),
  ].sort();

  const checkpoints = proof.checkpoints.map((reference): CheckpointResult => {
    const actual = first.find((c) => c.scenario === reference.scenario && c.step === reference.step);
    if (!actual)
      throw new Error(`no checkpoint for ${reference.scenario} step ${reference.step} on the candidate`);
    const match = matchScreens(reference.screen, actual.screen, {
      mapping: proof.mappings[reference.screen.id],
    });
    return {
      scenario: reference.scenario,
      step: reference.step,
      screen: reference.screen.id,
      diff: diffScreens(match, volatile),
    };
  });

  const equal = checkpoints.every((c) => c.diff.counts.different === 0 && c.diff.counts.missing === 0);
  return { volatile, checkpoints, equal };
}
