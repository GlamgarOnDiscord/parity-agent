import type { Config } from "../config";
import type { AppDriver, BrowserDriverOptions, DesktopDriverOptions } from "./types";

type BrowserFactory = (options: BrowserDriverOptions) => Promise<AppDriver>;
type DesktopFactory = (options: DesktopDriverOptions) => Promise<AppDriver>;

const browsers = new Map<Config["PARITY_BROWSER"], BrowserFactory>();
let desktop: DesktopFactory | undefined;

/** Implementations register themselves; callers never import one directly (docs/decisions.md D1). */
export function registerBrowser(name: Config["PARITY_BROWSER"], factory: BrowserFactory): void {
  browsers.set(name, factory);
}

export function registerDesktop(factory: DesktopFactory): void {
  desktop = factory;
}

export async function openBrowser(config: Config, options: BrowserDriverOptions): Promise<AppDriver> {
  const factory = browsers.get(config.PARITY_BROWSER);
  if (!factory) throw new Error(`no browser driver registered for PARITY_BROWSER=${config.PARITY_BROWSER}`);
  return factory({ ...options, cdpUrl: options.cdpUrl ?? config.PARITY_CDP_URL });
}

export async function openDesktop(options: DesktopDriverOptions): Promise<AppDriver> {
  if (!desktop) throw new Error("no desktop driver registered");
  return desktop(options);
}
