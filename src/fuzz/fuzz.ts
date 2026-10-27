import { diffScreens, type ScreenDiff } from "../diff/diff";
import type { AppDriver } from "../drivers/types";
import { matchScreens } from "../fields/match";
import type { Adapter, Checkpoint, Proof } from "../proof/schema";
import { replay } from "../replay/replay";
import { type Case, caseScenario, describeCase, type FuzzSpec, generateCase, seeded, shrink } from "./case";

export interface CaseResult {
  /** What the reference showed: kept as the checkpoints of the case if it becomes part of the proof. */
  reference: Checkpoint[];
  diffs: ScreenDiff[];
  differs: boolean;
  /** Labels that differ or are missing, the error if the candidate could not play the case. Sorted. */
  signature: string[];
  /** The candidate could not play a step the reference took, for example an input it does not have. */
  error?: string;
}

export interface Sides {
  reference: AppDriver;
  candidate: AppDriver;
  /** How the reference reaches the screen (login, its own paths). */
  adapter?: Adapter;
  volatile?: string[];
}

/** Play one case on both apps at once and compare every checkpoint in plain code. */
export async function playCase(sides: Sides, spec: FuzzSpec, c: Case, id = "fuzz"): Promise<CaseResult> {
  const scenario = caseScenario(spec, c, id);
  const [reference, candidate] = await Promise.all([
    replay(sides.reference, scenario, undefined, sides.adapter),
    replay(sides.candidate, scenario).catch((error: unknown) => String(error)),
  ]);
  if (typeof candidate === "string") {
    const error = candidate.replace(/ on https?:\/\/\S+/g, "").slice(0, 300);
    return { reference, diffs: [], differs: true, signature: [`error: ${error}`], error };
  }
  const diffs = reference.map((r) => {
    const actual = candidate.find((x) => x.step === r.step);
    return diffScreens(
      matchScreens(r.screen, actual?.screen ?? { ...r.screen, fields: [] }),
      sides.volatile ?? [],
    );
  });
  const signature = [
    ...new Set(
      diffs.flatMap((d) => [
        ...d.fields.filter((f) => f.verdict === "different").map((f) => f.legacy.label),
        ...d.missingInRebuilt.map((f) => `missing: ${f.label}`),
      ]),
    ),
  ].sort();
  return { reference, diffs, differs: signature.length > 0, signature };
}

export interface Failure {
  /** Index of the generated case that failed first, so `--seed` and this index find it again. */
  index: number;
  original: Case;
  /** The smallest case found that still differs, reproduced a second time. */
  case: Case;
  result: CaseResult;
  shrinkRuns: number;
}

export interface FuzzReport {
  seed: number;
  count: number;
  played: number;
  /** Cases the reference itself could not play: a generator reaching outside what the app accepts. */
  rejected: number;
  failures: Failure[];
}

/**
 * Differential fuzzing: generate cases from a seed, play each on the reference and the candidate, and shrink every
 * new kind of difference to the smallest case that still shows it. The same seed always gives the same cases.
 */
export async function fuzz(
  sides: Sides,
  spec: FuzzSpec,
  options: {
    seed: number;
    count: number;
    maxFailures?: number;
    maxShrinkRuns?: number;
    onCase?: (index: number, c: Case, result: CaseResult | null) => void;
  },
): Promise<FuzzReport> {
  const rand = seeded(options.seed);
  const report: FuzzReport = {
    seed: options.seed,
    count: options.count,
    played: 0,
    rejected: 0,
    failures: [],
  };
  const known = new Set<string>();
  for (let index = 0; index < options.count; index++) {
    const c = generateCase(spec, rand);
    const result = await playCase(sides, spec, c).catch(() => null);
    options.onCase?.(index, c, result);
    if (!result) {
      report.rejected++;
      continue;
    }
    report.played++;
    if (!result.differs || known.has(result.signature.join("|"))) continue;
    known.add(result.signature.join("|"));

    // Shrinking keeps a case only while every label that first differed still differs, so it cannot drift to
    // another bug, one already reported for example.
    const shrunk = await shrink(
      spec,
      c,
      async (candidate) => {
        const r = await playCase(sides, spec, candidate).catch(() => null);
        return !!r && result.signature.every((s) => r.signature.includes(s));
      },
      options.maxShrinkRuns,
    );
    const again = await playCase(sides, spec, shrunk.case).catch(() => null);
    if (!again?.differs) continue;
    const final = again.signature.join("|");
    if (report.failures.some((f) => f.result.signature.join("|") === final)) continue;
    known.add(final);
    report.failures.push({ index, original: c, case: shrunk.case, result: again, shrinkRuns: shrunk.tries });
    if (report.failures.length >= (options.maxFailures ?? 3)) break;
  }
  return report;
}

/**
 * Every difference found becomes a scenario of the proof, with what the reference showed as its checkpoint, so
 * a later change that brings it back fails the proof. A case already in the proof is not added twice.
 */
export function addFailures(
  proof: Proof,
  spec: FuzzSpec,
  report: FuzzReport,
): { proof: Proof; added: string[] } {
  const next: Proof = { ...proof, scenarios: [...proof.scenarios], checkpoints: [...proof.checkpoints] };
  const added: string[] = [];
  for (const f of report.failures) {
    // Named after the case itself: a later round with the same seed may shrink another case at the same index.
    const id = `${spec.id}-fuzz-${Bun.hash(JSON.stringify(f.case)).toString(16).slice(0, 10)}`;
    const name = `${spec.name}: ${describeCase(spec, f.case)} (seed ${report.seed}, case ${f.index})`;
    const scenario = caseScenario(spec, f.case, id, name);
    const steps = JSON.stringify(scenario.steps.slice(0, -1));
    if (next.scenarios.some((s) => s.id === id || JSON.stringify(s.steps.slice(0, -1)) === steps)) continue;
    next.scenarios.push(scenario);
    // The checkpoint was read under the generic id; it is stored under the scenario's own.
    for (const cp of f.result.reference) {
      next.checkpoints.push({ scenario: id, step: cp.step, screen: { ...cp.screen, id } });
    }
    added.push(id);
  }
  return { proof: next, added };
}
