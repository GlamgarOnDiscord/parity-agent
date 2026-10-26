import type { AppDriver } from "../drivers/types";
import type { Checkpoint, Scenario } from "../proof/schema";

/** Play a scenario on one app from a clean state and record the fields at every `check` step. */
export async function replay(driver: AppDriver, scenario: Scenario): Promise<Checkpoint[]> {
  await driver.reset();
  const checkpoints: Checkpoint[] = [];
  for (const [index, step] of scenario.steps.entries()) {
    if (step.do === "check") {
      checkpoints.push({ scenario: scenario.id, step: index, screen: await driver.readScreen(step.screen) });
    } else {
      await driver.perform(step);
    }
  }
  return checkpoints;
}
