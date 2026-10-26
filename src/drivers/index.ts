// Importing the implementations registers them; callers only use the registry functions.
import "./browser";

export { openBrowser, openDesktop } from "./registry";
export type { AppDriver } from "./types";
