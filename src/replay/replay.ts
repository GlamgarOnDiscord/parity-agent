import type { AppDriver } from "../drivers/types";
import type { DataUrl } from "../models/types";
import type { Adapter, Checkpoint, Scenario } from "../proof/schema";

/** Called at every `check` step with what the screen showed, for evidence in reports. */
export type OnCheck = (checkpoint: Checkpoint, screenshot: DataUrl) => void;

/**
 * Play a scenario on one app from a clean state and record the fields at every `check` step. An adapter, for the
 * reference app only, runs its prelude first and maps the scenario's paths to the app's own.
 */
export async function replay(
  driver: AppDriver,
  scenario: Scenario,
  onCheck?: OnCheck,
  adapter?: Adapter,
): Promise<Checkpoint[]> {
  await driver.reset();
  for (const step of adapter?.prelude ?? []) await driver.perform(step);
  const checkpoints: Checkpoint[] = [];
  for (const [index, step] of scenario.steps.entries()) {
    if (step.do === "check") {
      const checkpoint = { scenario: scenario.id, step: index, screen: await driver.readScreen(step.screen) };
      checkpoints.push(checkpoint);
      if (onCheck) onCheck(checkpoint, await driver.screenshot());
    } else if (step.do === "open" && adapter?.paths[step.path]) {
      await driver.perform({ ...step, path: adapter.paths[step.path] as string });
    } else {
      await driver.perform(step);
    }
  }
  return checkpoints;
}
