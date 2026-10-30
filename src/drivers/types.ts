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
  /**
   * The scenario steps a raw action stands for, read from the element under it before it runs, so an exploration
   * can be replayed on another app: a click on a button becomes a click on its name, typing becomes a fill of the
   * focused field's label. `[]` when the action changes nothing a scenario keeps (a move, a scroll, focusing a
   * field), `null` when it cannot be said with labels (a drag, a click on a name another element comes first for).
   */
  describe?(action: ComputerAction): Promise<Exclude<Step, { do: "check" }>[] | null>;
  screenshot(): Promise<DataUrl>;
  /** Links on the current screen to other screens of the same app, as paths, for an inventory. */
  links?(): Promise<{ text: string; path: string }[]>;
  /** The choices of a list field, by its label: the text a replay picks with `fill`, and the value behind it. */
  choices?(field: string): Promise<{ text: string; value: string }[]>;
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
