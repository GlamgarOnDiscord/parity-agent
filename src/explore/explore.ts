import type { AppDriver } from "../drivers/types";
import type { Screen } from "../fields/types";
import type { ComputerClient, ComputerStep, DataUrl } from "../models/types";
import { type Proof, type Scenario, ScenarioSchema, type Step } from "../proof/schema";

export interface FoundScreen {
  step: number;
  location: string;
  title: string;
  labels: string[];
  screenshot: DataUrl;
  /** The fields as read when the screen was found: the reference values of its scenario. */
  screen: Screen;
  /**
   * How to reach it again, by labels, from the end of the setup: what the model did, as scenario steps. Absent
   * when one of its actions could not be said with labels (a drag, an ambiguous name).
   */
  steps?: Exclude<Step, { do: "check" }>[];
  /**
   * The steps include an action Meta asked to confirm, acknowledged under the operator's `--ack` for this run.
   * Such a scenario is saved only when the operator approves it separately, after reading its steps.
   */
  acknowledged?: boolean;
}

export interface Exploration {
  steps: number;
  actions: number;
  /** Screens whose fields no recorded checkpoint showed. */
  found: FoundScreen[];
  stoppedBecause: "done" | "max-steps" | "max-cost" | "safety-check" | "left-the-app" | "error";
  note?: string;
  costUsd: number;
  /** Meta's per-call receipts, kept for audit. */
  receipts: string[];
  /** Safety checks acknowledged under the operator's standing permission, with the actions they covered. */
  acknowledged: { step: number; codes: string[]; actions: ComputerStep["actions"] }[];
}

export interface ExploreOptions {
  /** Steps played first, without the model: logging in, opening the starting screen. */
  setup: Scenario["steps"];
  /** Screens already covered by the proof; a screen counts as new when its labels are mostly unseen. */
  known: Screen[];
  goal: string;
  maxSteps: number;
  /** Spending cap for this exploration in USD, on top of the global PARITY_BUDGET_USD. */
  maxCostUsd: number;
  runId?: string;
  /** Where the app lives; leaving it ends the exploration. */
  origin: string;
  /**
   * Safety check codes the operator acknowledges in advance for this sandbox (`--ack`). Any other code stops the
   * exploration. Only honoured for an app on the loopback interface.
   */
  acknowledge?: string[];
}

const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]"]);

const INSTRUCTION = (goal: string) =>
  [
    "You are exploring a business application in a disposable sandbox with demo data.",
    `Goal: ${goal}`,
    "Open screens and forms that look like they hold business rules (prices, taxes, discounts, totals, limits).",
    "Use only the demo data already in the application. Do not log out, do not change settings or passwords,",
    "and do not leave the application. When you have seen enough, stop and list the screens you visited.",
  ].join(" ");

const signature = (screen: Screen) =>
  new Set(screen.fields.map((f) => f.label.replace(/[\s:]+$/g, "").toLowerCase()).filter(Boolean));

/** Share of a screen's labels already present on known screens: 1 means nothing new. */
function overlap(labels: Set<string>, known: Set<string>[]): number {
  if (labels.size === 0) return 1;
  let best = 0;
  for (const k of known) {
    let hit = 0;
    for (const l of labels) if (k.has(l)) hit++;
    best = Math.max(best, hit / labels.size);
  }
  return best;
}

/**
 * Muse Spark computer use drives the app; Parity only watches. After every model step the screen is read without
 * AI, and a screen whose labels are mostly new is kept as a finding. Safety checks are never acknowledged on the
 * model's behalf: exploration stops and reports them, unless the operator listed that exact code for a local app.
 */
export async function explore(
  driver: AppDriver,
  computer: ComputerClient,
  options: ExploreOptions,
): Promise<Exploration> {
  if (driver.kind === "browser" && !driver.confined) {
    throw new Error(
      "exploration needs a browser Parity launched itself (driver chromium), confined to the app",
    );
  }
  const acknowledge = new Set(options.acknowledge ?? []);
  if (acknowledge.size > 0 && !LOOPBACK.has(new URL(options.origin).hostname)) {
    throw new Error(`safety checks are only acknowledged for an app on this machine, not ${options.origin}`);
  }
  await driver.reset();
  for (const step of options.setup) if (step.do !== "check") await driver.perform(step);

  const seen = options.known.map(signature);
  const found: FoundScreen[] = [];
  const receipts: string[] = [];
  let costUsd = 0;
  let actions = 0;
  let previous: ComputerStep | undefined;
  const acknowledged: Exploration["acknowledged"] = [];
  // Null once an action could not be said with labels, and for a driver that cannot say any.
  let trace: Exclude<Step, { do: "check" }>[] | null = driver.describe ? [] : null;
  let throughAck = false;

  const result = (stoppedBecause: Exploration["stoppedBecause"], note?: string, steps = 0): Exploration => ({
    steps,
    actions,
    found,
    stoppedBecause,
    note,
    costUsd,
    receipts,
    acknowledged,
  });

  for (let n = 1; n <= options.maxSteps; n++) {
    let step: ComputerStep;
    try {
      step = await computer.step({
        instruction: previous ? undefined : INSTRUCTION(options.goal),
        screenshot: await driver.screenshot(),
        previous: previous?.callId
          ? {
              responseId: previous.responseId,
              callId: previous.callId,
              acknowledged: previous.safetyChecks.length > 0 ? previous.safetyChecks : undefined,
            }
          : undefined,
        runId: options.runId,
      });
    } catch (error) {
      return result("error", String(error).slice(0, 300), n - 1);
    }
    costUsd += step.call.costUsd;
    if (costUsd >= options.maxCostUsd) return result("max-cost", `$${costUsd.toFixed(3)} spent`, n);
    if (step.safetyReceipt) receipts.push(step.safetyReceipt);
    if (step.safetyChecks.length > 0 && step.safetyChecks.every((c) => acknowledge.has(c.code))) {
      acknowledged.push({ step: n, codes: step.safetyChecks.map((c) => c.code), actions: step.actions });
      // The operator's standing permission covers this sandbox run, not a test that replays it later.
      throughAck = true;
    } else if (step.safetyChecks.length > 0) {
      const checks = step.safetyChecks.map((c) => `${c.code}: ${c.message}`).join("; ");
      return result("safety-check", `${checks} Pending actions: ${JSON.stringify(step.actions)}`, n);
    }
    if (!step.callId) return result("done", step.text, n);

    for (const action of step.actions) {
      const said = trace && driver.describe ? await driver.describe(action).catch(() => null) : null;
      if (said === null) trace = null;
      else if (trace) for (const s of said) record(trace, s);
      await driver.act(action);
      actions++;
    }
    await new Promise((r) => setTimeout(r, 300));
    const location = await driver.location();
    // A refused navigation lands on an error page, which counts as leaving too.
    if (driver.kind === "browser" && !`${location}/`.startsWith(`${options.origin}/`)) {
      return result("left-the-app", location, n);
    }
    const screen = await driver.readScreen(`explored-${n}`);
    const labels = signature(screen);
    if (overlap(labels, seen) < 0.5) {
      found.push({
        step: n,
        location,
        title: screen.title ?? "",
        labels: [...labels],
        screenshot: await driver.screenshot(),
        screen,
        steps: trace ? [...trace] : undefined,
        acknowledged: throughAck || undefined,
      });
      seen.push(labels);
    }
    previous = step;
  }
  return result("max-steps", undefined, options.maxSteps);
}

/** Typing twice in the same field is one fill with the final value. */
function record(trace: Exclude<Step, { do: "check" }>[], step: Exclude<Step, { do: "check" }>) {
  const last = trace.at(-1);
  if (step.do === "fill" && last?.do === "fill" && last.field === step.field) last.value = step.value;
  else trace.push(step);
}

/**
 * Every screen exploration found with its path becomes a scenario of the proof: the setup, what the model did,
 * then a check of the fields it showed. A test no person wrote, replayed on the rebuild like any other. A screen
 * already reached by the same steps is not added twice; one reached through an acknowledged action is held back
 * unless `acknowledged` says the operator approved it.
 */
export function addExplored(
  proof: Proof,
  setup: Scenario["steps"],
  run: Pick<Exploration, "found">,
  name: string,
  options: { acknowledged?: boolean } = {},
): { proof: Proof; added: string[]; skipped: number; held: number } {
  const next: Proof = { ...proof, scenarios: [...proof.scenarios], checkpoints: [...proof.checkpoints] };
  const added: string[] = [];
  let skipped = 0;
  let held = 0;
  for (const f of run.found) {
    if (!f.steps || f.steps.length === 0) {
      skipped++;
      continue;
    }
    if (f.acknowledged && !options.acknowledged) {
      held++;
      continue;
    }
    const before = [...setup.filter((s) => s.do !== "check"), ...f.steps];
    const id = `explored-${Bun.hash(JSON.stringify(before)).toString(16).slice(0, 10)}`;
    const key = JSON.stringify(before);
    if (next.scenarios.some((s) => s.id === id || JSON.stringify(s.steps.slice(0, -1)) === key)) continue;
    const title = f.title || f.location;
    const scenario = ScenarioSchema.parse({
      id,
      name: `${name}: ${title} (explored, step ${f.step})`,
      steps: [
        ...before,
        { do: "check", screen: id, note: `found by exploration: ${f.labels.slice(0, 6).join(", ")}` },
      ],
    });
    next.scenarios.push(scenario);
    next.checkpoints.push({ scenario: id, step: before.length, screen: { ...f.screen, id } });
    added.push(id);
  }
  return { proof: next, added, skipped, held };
}
