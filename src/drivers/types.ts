import type { Screen } from "../fields/types";
import type { ComputerAction, DataUrl } from "../models/types";

/** One way to drive an app under test. Replay and exploration only ever see this interface. */
export interface AppDriver {
  readonly kind: "browser" | "desktop";
  readonly name: string;
  /** Bring the app to a known clean state (fresh sandbox, seeded data). */
  reset(): Promise<void>;
  act(action: ComputerAction): Promise<void>;
  screenshot(): Promise<DataUrl>;
  /** The fields visible on the current screen, read without AI when the platform allows it. */
  readScreen(): Promise<Screen>;
  close(): Promise<void>;
}

export interface BrowserDriverOptions {
  url: string;
  cdpUrl?: string;
  viewport?: { width: number; height: number };
}

export interface DesktopDriverOptions {
  /** Docker container of the Wine sandbox. */
  container: string;
  display?: string;
}
