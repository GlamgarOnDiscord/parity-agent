import type { Screen } from "../fields/types";
import type { ComputerAction, DataUrl } from "../models/types";
import type { Step } from "../proof/schema";

/** One way to drive an app under test. Replay and exploration only ever see this interface. */
export interface AppDriver {
  readonly kind: "browser" | "desktop";
  readonly name: string;
  /** True when Parity launched the browser itself with its egress guard (proxy dead end, WebRTC policy). */
  readonly confined: boolean;
  /** Bring the app to a known clean state (fresh sandbox, seeded data). */
  reset(): Promise<void>;
  /** A scenario step, addressed by labels so the same scenario runs on the legacy and the rebuilt app. */
  perform(step: Exclude<Step, { do: "check" }>): Promise<void>;
  /** A raw computer-use action, for exploration. */
  act(action: ComputerAction): Promise<void>;
  screenshot(): Promise<DataUrl>;
  /** Where the app is now: the page URL, or the window title on a desktop. */
  location(): Promise<string>;
  /** The fields visible on the current screen, read without AI when the platform allows it. */
  readScreen(screenId: string): Promise<Screen>;
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
