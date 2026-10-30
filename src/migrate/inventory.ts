import type { AppDriver } from "../drivers/types";
import type { Screen } from "../fields/types";
import type { Step } from "../proof/schema";

export interface InventoryScreen {
  path: string;
  title: string;
  /** Labels in screen order; repeated grid labels once. */
  labels: string[];
  /** Fields that hold a list of records: picking one shows that record (a customer, an item). */
  selectors: { field: string; choices: number }[];
  /** Paths of the screens this one links to. */
  links: string[];
  /** Screens reached from the same menu share a group (FrontAccounting: Sales, Items and Inventory...). */
  menu?: string;
}

export interface Inventory {
  origin: string;
  at: string;
  screens: InventoryScreen[];
  /** Links not followed, because their words say they change data or leave the session. */
  skipped: string[];
}

/** Links that change data or end the session are never followed by a crawl, even in a sandbox. */
export const UNSAFE =
  /logout|log_out|signout|delete|remove|void|purge|reset|backup|restore|install|upgrade|close|cancel|reopen|post|approve|process|allocate|\/admin\//i;

const labelKey = (label: string) => label.replace(/[\s:*]+$/g, "").trim();

function summary(
  screen: Screen,
  links: string[],
  selectors: InventoryScreen["selectors"],
): Omit<InventoryScreen, "path"> {
  const labels: string[] = [];
  for (const f of screen.fields) {
    const l = labelKey(f.label);
    if (l && !labels.includes(l)) labels.push(l);
  }
  return { title: screen.title ?? "", labels, selectors, links };
}

/**
 * Every screen reachable by links from where the setup leaves the app, read without AI: its fields, the lists
 * that select a record, and its links. Breadth first, at most `maxScreens`, never through an unsafe link. No
 * model call: exploration with computer use is only needed for screens that no link reaches.
 */
export async function crawl(
  driver: AppDriver,
  options: {
    setup: Exclude<Step, { do: "check" }>[];
    start: string[];
    maxScreens?: number;
    /** A list with fewer choices than this is a setting (currency, tax group), not a list of records. */
    minChoices?: number;
  },
): Promise<Inventory> {
  if (!driver.links) throw new Error(`the ${driver.kind} driver cannot list links; use exploration instead`);
  await driver.reset();
  for (const step of options.setup) await driver.perform(step);
  const origin = new URL(await driver.location()).origin;
  const queue = [...options.start];
  const seen = new Set(queue);
  const screens: InventoryScreen[] = [];
  const skipped: string[] = [];
  const menuOf = new Map<string, string>();
  while (queue.length > 0 && screens.length < (options.maxScreens ?? 60)) {
    const path = queue.shift() as string;
    try {
      await driver.perform({ do: "open", path });
    } catch {
      continue;
    }
    // A redirect (to the login page, for example) is not the screen the link promised.
    const at = new URL(await driver.location());
    if (at.origin !== origin) continue;
    const screen = await driver.readScreen(path);
    const links = await driver.links();
    const selectors: InventoryScreen["selectors"] = [];
    if (driver.choices) {
      for (const f of screen.fields) {
        if (selectors.some((s) => s.field === f.label)) continue;
        const choices = await driver.choices(f.label).catch(() => []);
        if (choices.length >= (options.minChoices ?? 4))
          selectors.push({ field: f.label, choices: choices.length });
      }
    }
    const out: string[] = [];
    for (const l of links) {
      if (UNSAFE.test(`${l.path} ${l.text}`)) {
        if (!skipped.includes(l.path)) skipped.push(l.path);
        continue;
      }
      out.push(l.path);
      if (!seen.has(l.path)) {
        seen.add(l.path);
        queue.push(l.path);
        if (!menuOf.has(l.path)) menuOf.set(l.path, screen.title || path);
      }
    }
    screens.push({ path, ...summary(screen, out, selectors), menu: menuOf.get(path) });
  }
  return { origin, at: new Date().toISOString(), screens, skipped };
}
