import type { AppDriver } from "../drivers/types";
import type { Field, Screen } from "../fields/types";
import type { Checkpoint, Scenario, Step } from "../proof/schema";

/** One kind of record the legacy app keeps, read through its own form: a customer, an item, the prices of an item. */
export interface Entity {
  id: string;
  /** The form that shows one record. */
  path: string;
  /** The list on that form that picks the record. */
  selector: string;
  /**
   * Some forms pick the record from the address rather than the list (FrontAccounting prices:
   * `?stock_id=102`): the query parameter, set to the choice's value.
   */
  param?: string;
  /** Labels of the record's fields, in screen order, grid labels with their line. */
  fields: string[];
  records: EntityRecord[];
}

export interface EntityRecord {
  /** The choice of the selector that shows it, as displayed. */
  key: string;
  /** The value behind that choice (an item code), used when the record is picked by `param`. */
  value: string;
  values: Field[];
}

/**
 * A label that is a form's internal name (`stock_id`, `_stock_id_edit`) is plumbing, not a business field: a
 * rebuild does not show it and the proof does not compare it.
 */
export const isInternal = (label: string) => /^_?[a-z]+(?:_[a-z]+)+$/.test(label.trim());

/** How a replay shows one record: open the form and pick it from the list, or open it by its address. */
export function pickSteps(
  entity: { path: string; selector: string; param?: string },
  choice: { text: string; value: string },
): Exclude<Step, { do: "check" }>[] {
  if (entity.param) {
    const sep = entity.path.includes("?") ? "&" : "?";
    return [{ do: "open", path: `${entity.path}${sep}${entity.param}=${encodeURIComponent(choice.value)}` }];
  }
  return [
    { do: "open", path: entity.path },
    { do: "fill", field: entity.selector, value: choice.text },
  ];
}

const keep = (screen: Screen, selector: string): Field[] =>
  screen.fields.filter((f) => f.label !== selector && !isInternal(f.label));

/**
 * Read every record of an entity through the legacy app's own form: pick each choice of its selector and read
 * the screen. Deterministic and free: no model call, nothing written. Choices that do not show a record (the
 * "New customer" entry, a blank) are skipped by `skip`.
 */
export async function readRecords(
  driver: AppDriver,
  options: {
    id: string;
    path: string;
    selector: string;
    setup: Exclude<Step, { do: "check" }>[];
    param?: string;
    max?: number;
    skip?: RegExp;
  },
): Promise<Entity> {
  if (!driver.choices) throw new Error(`the ${driver.kind} driver cannot list the choices of a field`);
  // A list known only by its form name has no label a rebuild could show: pick its records by address instead.
  if (isInternal(options.selector) && !options.param) {
    throw new Error(
      `the list "${options.selector}" on ${options.path} has no visible label; set param so records are opened by address`,
    );
  }
  await driver.reset();
  for (const step of options.setup) await driver.perform(step);
  await driver.perform({ do: "open", path: options.path });
  const skip = options.skip ?? /^\s*(new\b.*|select\b.*|all\b.*|-*)\s*$/i;
  const choices = (await driver.choices(options.selector)).filter((c) => !skip.test(c.text));
  const records: EntityRecord[] = [];
  const fields: string[] = [];
  for (const c of choices.slice(0, options.max ?? 50)) {
    for (const step of pickSteps(options, c)) await driver.perform(step);
    const values = keep(await driver.readScreen(`${options.id}:${c.text}`), options.selector);
    for (const f of values) {
      const label = f.group ? `${f.label} [${f.group}]` : f.label;
      if (!fields.includes(label)) fields.push(label);
    }
    records.push({ key: c.text, value: c.value, values });
  }
  // A form that ignored the pick shows the same record every time: better to fail than migrate copies.
  const shown = new Set(records.map((r) => JSON.stringify(r.values.map((f) => f.value))));
  if (records.length > 1 && shown.size === 1) {
    throw new Error(
      `every ${options.id} record read the same on ${options.path}: picking "${options.selector}" does not change the form; try param`,
    );
  }
  return {
    id: options.id,
    path: options.path,
    selector: options.selector,
    param: options.param,
    fields,
    records,
  };
}

/**
 * Each record becomes a scenario of the proof: open the form, pick the record, check what it shows. The rebuild
 * must show the same record from its migrated data, field by field.
 */
export function recordScenarios(
  entity: Entity,
  name: string,
): { scenarios: Scenario[]; checkpoints: Checkpoint[] } {
  const scenarios: Scenario[] = [];
  const checkpoints: Checkpoint[] = [];
  for (const r of entity.records) {
    const id = `${entity.id}-${Bun.hash(r.key).toString(16).slice(0, 8)}`;
    scenarios.push({
      id,
      name: `${name}: ${r.key}`,
      steps: [
        ...pickSteps(entity, { text: r.key, value: r.value }),
        { do: "check", screen: id, note: `${entity.id} record ${r.key}` },
      ],
    });
    const step = pickSteps(entity, { text: r.key, value: r.value }).length;
    checkpoints.push({ scenario: id, step, screen: { id, app: name, fields: r.values } });
  }
  return { scenarios, checkpoints };
}

/** The migrated data the rebuild serves: one JSON file per entity, records keyed by the selector's choice. */
export function dataFile(entity: Entity): {
  entity: string;
  selector: string;
  records: { key: string; value: string; fields: EntityRecord["values"] }[];
} {
  return {
    entity: entity.id,
    selector: entity.selector,
    records: entity.records.map((r) => ({
      key: r.key,
      value: r.value,
      fields: r.values.map(({ label, value, group }) => ({
        label,
        value,
        ...(group ? { group } : {}),
      })) as Field[],
    })),
  };
}
