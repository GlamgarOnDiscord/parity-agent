import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import puppeteer, {
  type Browser,
  type BrowserContext,
  type ConnectionTransport,
  type ElementHandle,
  type KeyInput,
  type Page,
} from "puppeteer-core";
import type { Field, Screen } from "../fields/types";
import type { ComputerAction, DataUrl } from "../models/types";
import type { Step } from "../proof/schema";
import { registerBrowser } from "./registry";
import type { AppDriver, BrowserDriverOptions } from "./types";

const CHROME_PATHS = [
  process.env.PARITY_CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter((p): p is string => Boolean(p));

interface RawField {
  label: string;
  value: string;
  box: { x: number; y: number; w: number; h: number };
  group?: string;
}

/** Runs in the page: every labelled value on screen. Explicit `data-field` wins; otherwise form controls. */
function collectFields(): RawField[] {
  const vw = window.innerWidth || 1;
  const vh = window.innerHeight || 1;
  const labelOf = (el: Element): string => {
    const explicit = el.getAttribute("data-field") ?? el.getAttribute("aria-label");
    if (explicit) return explicit;
    const fromLabel = (el as HTMLInputElement).labels?.[0]?.textContent;
    if (fromLabel) return fromLabel;
    return el.getAttribute("placeholder") ?? el.getAttribute("name") ?? "";
  };
  const fieldValue = (el: Element): string => {
    if (el instanceof HTMLInputElement) return el.type === "checkbox" ? String(el.checked) : el.value;
    if (el instanceof HTMLSelectElement) return el.selectedOptions[0]?.textContent ?? el.value;
    if (el instanceof HTMLTextAreaElement || el instanceof HTMLOutputElement) return el.value;
    return el.textContent ?? "";
  };
  const out: RawField[] = [];
  const nodes = document.querySelectorAll("[data-field], input:not([type=hidden]), select, textarea, output");
  for (const el of new Set(nodes)) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const label = labelOf(el).replace(/\s+/g, " ").trim();
    if (!label) continue;
    out.push({
      label,
      value: fieldValue(el).replace(/\s+/g, " ").trim(),
      box: { x: r.x / vw, y: r.y / vh, w: r.width / vw, h: r.height / vh },
      group: el.closest("[data-group]")?.getAttribute("data-group") ?? undefined,
    });
  }
  return out;
}

/** Runs in the page: the form control whose label contains `text` (case-insensitive). */
function controlByLabel(text: string): Element | null {
  const needle = text.toLowerCase();
  for (const el of document.querySelectorAll("input, select, textarea")) {
    const labels = [...((el as HTMLInputElement).labels ?? [])].map((l) => l.textContent ?? "");
    const names = [...labels, el.getAttribute("aria-label") ?? "", el.getAttribute("placeholder") ?? ""];
    if (names.some((n) => n.toLowerCase().includes(needle))) return el;
  }
  return null;
}

/** Runs in the page: the button or link whose text contains `text`. */
function clickableByText(text: string): Element | null {
  const needle = text.toLowerCase();
  for (const el of document.querySelectorAll(
    "button, [role=button], a, input[type=submit], input[type=button]",
  )) {
    const name = (
      el.textContent ||
      (el as HTMLInputElement).value ||
      el.getAttribute("aria-label") ||
      ""
    ).trim();
    if (name.toLowerCase().includes(needle)) return el;
  }
  return null;
}

class BrowserDriver implements AppDriver {
  readonly kind = "browser" as const;
  constructor(
    readonly name: string,
    private readonly browser: Browser,
    private context: BrowserContext,
    private page: Page,
    private readonly options: BrowserDriverOptions,
    private readonly cleanup: () => Promise<void>,
  ) {}

  async reset() {
    await this.context.close();
    this.context = await this.browser.createBrowserContext();
    this.page = await this.context.newPage();
    await this.page.setViewport(this.options.viewport ?? { width: 1280, height: 800 });
  }

  private async find(fn: (text: string) => Element | null, text: string, what: string) {
    const handle = await this.page.evaluateHandle(fn, text);
    const element = handle.asElement() as ElementHandle<Element> | null;
    if (!element) throw new Error(`no ${what} matching "${text}" on ${this.page.url()}`);
    return element;
  }

  async perform(step: Exclude<Step, { do: "check" }>) {
    switch (step.do) {
      case "open": {
        const base = new URL(this.options.url);
        const target = new URL(step.path, base);
        if (target.origin !== base.origin) throw new Error(`refusing to leave ${base.origin}: ${step.path}`);
        await this.page.goto(target.toString(), { waitUntil: "domcontentloaded" });
        return;
      }
      case "fill": {
        const control = await this.find(controlByLabel, step.field, "field");
        await control.evaluate((el) => {
          (el as HTMLInputElement).value = "";
        });
        await control.type(step.value);
        return;
      }
      case "click": {
        const target = await this.find(clickableByText, step.target, "button");
        await target.click();
        return;
      }
    }
  }

  async act(action: ComputerAction) {
    const m = this.page.mouse;
    switch (action.type) {
      case "click":
        return m.click(action.x, action.y);
      case "double_click":
        return m.click(action.x, action.y, { count: 2 });
      case "move":
        return m.move(action.x, action.y);
      case "type":
        return this.page.keyboard.type(action.text);
      case "keypress":
        for (const key of action.keys) await this.page.keyboard.press(key as KeyInput);
        return;
      case "scroll":
        await m.move(action.x, action.y);
        return m.wheel({ deltaX: action.scroll_x, deltaY: action.scroll_y });
      case "drag": {
        const [first, ...rest] = action.path;
        if (!first) return;
        await m.move(first.x, first.y);
        await m.down();
        for (const p of rest) await m.move(p.x, p.y);
        return m.up();
      }
      case "screenshot":
      case "wait":
        return;
    }
  }

  async screenshot(): Promise<DataUrl> {
    const png = await this.page.screenshot({ type: "png", encoding: "base64" });
    return `data:image/png;base64,${png}`;
  }

  async readScreen(screenId: string): Promise<Screen> {
    const raw: RawField[] = await this.page.evaluate(collectFields);
    const counts = new Map<string, number>();
    const fields: Field[] = raw.map((f) => {
      const n = (counts.get(f.label) ?? 0) + 1;
      counts.set(f.label, n);
      const slug = f.label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      return { id: n === 1 ? slug : `${slug}-${n}`, ...f };
    });
    return { id: screenId, app: this.name, title: await this.page.title(), fields };
  }

  async close() {
    await this.browser.disconnect().catch(() => {});
    await this.cleanup();
  }
}

/** CDP over Bun's native WebSocket (the `ws` package bundled in browser libraries hangs under Bun). */
async function webSocketTransport(url: string): Promise<ConnectionTransport> {
  const ws = new WebSocket(url);
  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve();
    ws.onerror = () => reject(new Error(`cannot open ${url}`));
  });
  const transport: ConnectionTransport = {
    send: (message) => ws.send(message),
    close: () => ws.close(),
  };
  ws.onmessage = (event) => transport.onmessage?.(String(event.data));
  ws.onclose = () => transport.onclose?.();
  return transport;
}

async function attach(
  name: string,
  wsUrl: string,
  options: BrowserDriverOptions,
  cleanup: () => Promise<void>,
) {
  const browser = await puppeteer.connect({
    transport: await webSocketTransport(wsUrl),
    defaultViewport: null,
  });
  // A fresh, temporary context every time: never a real user profile.
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport(options.viewport ?? { width: 1280, height: 800 });
  return new BrowserDriver(name, browser, context, page, options, cleanup);
}

/** Start Chrome on a local debugging port with a throwaway profile; return its browser WebSocket URL. */
async function launchChrome(
  executablePath: string,
): Promise<{ wsUrl: string; cleanup: () => Promise<void> }> {
  const profile = mkdtempSync(join(tmpdir(), "parity-chrome-"));
  const proc = Bun.spawn(
    [
      executablePath,
      "--headless=new",
      "--remote-debugging-address=127.0.0.1",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-sync",
      "about:blank",
    ],
    { stdout: "ignore", stderr: "pipe" },
  );
  const cleanup = async () => {
    proc.kill();
    await proc.exited;
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  };
  const reader = proc.stderr.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value);
    const match = /DevTools listening on (ws:\/\/\S+)/.exec(buffer);
    if (match?.[1]) {
      reader.releaseLock();
      return { wsUrl: match[1], cleanup };
    }
  }
  await cleanup();
  throw new Error(`Chrome did not open a debugging port: ${buffer.slice(0, 300)}`);
}

registerBrowser("chromium", async (options) => {
  const executablePath = CHROME_PATHS.find((p) => existsSync(p));
  if (!executablePath) throw new Error("no Chrome or Chromium found; set PARITY_CHROME_PATH");
  const { wsUrl, cleanup } = await launchChrome(executablePath);
  return attach("chromium", wsUrl, options, cleanup);
});

/** Lightpanda or any CDP browser already running: PARITY_CDP_URL is its browser WebSocket URL. */
const viaCdp = async (name: string, options: BrowserDriverOptions) => {
  if (!options.cdpUrl) throw new Error("PARITY_CDP_URL is required for this driver");
  return attach(name, options.cdpUrl, options, async () => {});
};
registerBrowser("lightpanda", (options) => viaCdp("lightpanda", options));
registerBrowser("cdp", (options) => viaCdp("cdp", options));
