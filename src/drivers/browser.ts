import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:net";
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
import { type RawField, scanPage } from "./read-fields";
import { registerBrowser } from "./registry";
import type { AppDriver, BrowserDriverOptions } from "./types";

const CHROME_PATHS = [
  process.env.PARITY_CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter((p): p is string => Boolean(p));

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
    readonly confined: boolean,
  ) {}

  async reset() {
    await this.context.close();
    this.context = await this.browser.createBrowserContext();
    this.page = await this.context.newPage();
    await this.page.setViewport(this.options.viewport ?? { width: 1280, height: 800 });
    await confine(this.page, this.options.url);
  }

  private async find(fn: (text: string) => unknown, text: string, what: string) {
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
        const control = await this.find(scanPage, step.field, "field");
        const picked = await control.evaluate((el, value) => {
          if (!(el instanceof HTMLSelectElement)) return null;
          const want = value.toLowerCase();
          const options = [...el.options];
          const option =
            options.find((o) => (o.textContent ?? "").trim().toLowerCase() === want || o.value === value) ??
            options.find((o) => (o.textContent ?? "").toLowerCase().includes(want));
          return option ? option.value : "";
        }, step.value);
        if (picked !== null) {
          if (!picked) throw new Error(`no option "${step.value}" in ${step.field}`);
          await (control as ElementHandle<HTMLSelectElement>).select(picked);
        } else {
          await control.evaluate((el) => {
            (el as HTMLInputElement).value = "";
          });
          await control.type(step.value);
          // Leaving the field fires `change`, which old apps use to look values up on the server.
          await control.evaluate((el) => (el as HTMLElement).blur());
        }
        await this.settle();
        return;
      }
      case "click": {
        const target = await this.find(clickableByText, step.target, "button");
        await target.click();
        await this.settle();
        return;
      }
    }
  }

  /** Waits for a navigation or an in-page request started by the last action to finish. */
  private async settle() {
    await new Promise((r) => setTimeout(r, 50));
    await this.page.waitForNetworkIdle({ idleTime: 150, timeout: 10_000 }).catch(() => {});
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

  async location() {
    return this.page.url();
  }

  async screenshot(): Promise<DataUrl> {
    const png = await this.page.screenshot({ type: "png", encoding: "base64" });
    return `data:image/png;base64,${png}`;
  }

  async readScreen(screenId: string): Promise<Screen> {
    const raw = (await this.page.evaluate(scanPage)) as RawField[];
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

/**
 * Local by default, also for the page: requests to any origin other than the app's are refused, so neither the
 * app nor an exploring model can reach the network through the browser.
 */
async function confine(page: Page, appUrl: string) {
  const origin = new URL(appUrl).origin;
  // WebRTC sends UDP, which no proxy sees: remove it from every document and frame before any script runs.
  await page.evaluateOnNewDocument(() => {
    for (const name of [
      "RTCPeerConnection",
      "webkitRTCPeerConnection",
      "RTCDataChannel",
      "RTCIceCandidate",
    ]) {
      try {
        Object.defineProperty(window, name, { value: undefined, writable: false, configurable: false });
      } catch {}
    }
    // No second window: a popup is a new page this script does not reach. Links and forms open in place.
    try {
      Object.defineProperty(window, "open", { value: () => null, writable: false, configurable: false });
    } catch {}
    document.addEventListener(
      "click",
      (event) => {
        const target = (event.target as Element | null)?.closest?.("a[target], area[target]");
        if (target) target.removeAttribute("target");
      },
      true,
    );
    document.addEventListener(
      "submit",
      (event) => (event.target as HTMLFormElement).removeAttribute("target"),
      true,
    );
  });
  // A popup that still gets through is closed at once.
  page.on("popup", (popup) => {
    popup?.close().catch(() => {});
  });
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (request.isInterceptResolutionHandled()) return;
    const url = request.url();
    let allowed = url.startsWith("data:") || url.startsWith("blob:");
    try {
      allowed ||= new URL(url).origin === origin;
    } catch {}
    if (allowed) request.continue();
    else request.abort("blockedbyclient");
  });
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
  confined: boolean,
) {
  const browser = await puppeteer.connect({
    transport: await webSocketTransport(wsUrl),
    defaultViewport: null,
  });
  // A fresh, temporary context every time: never a real user profile.
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport(options.viewport ?? { width: 1280, height: 800 });
  await confine(page, options.url);
  return new BrowserDriver(name, browser, context, page, options, cleanup, confined);
}

/** Start Chrome on a local debugging port with a throwaway profile; return its browser WebSocket URL. */
/** A proxy that accepts connections and closes them at once: every request sent to it fails. */
async function deadEnd(): Promise<{ port: number; server: Server }> {
  const server = createServer((socket) => socket.destroy());
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("egress guard did not start");
  return { port: address.port, server };
}

/**
 * Local by default, for the whole browser: all traffic goes to a dead-end proxy, loopback included, except the
 * app's own host and port. This covers what page-level interception misses: popups, WebSockets, workers.
 */
async function launchChrome(
  executablePath: string,
  appUrl: string,
): Promise<{ wsUrl: string; cleanup: () => Promise<void> }> {
  const profile = mkdtempSync(join(tmpdir(), "parity-chrome-"));
  // Browser-level WebRTC policy in the throwaway profile: no UDP outside the proxy, which accepts none.
  mkdirSync(join(profile, "Default"), { recursive: true });
  writeFileSync(
    join(profile, "Default", "Preferences"),
    JSON.stringify({
      webrtc: {
        ip_handling_policy: "disable_non_proxied_udp",
        multiple_routes_enabled: false,
        nonproxied_udp_enabled: false,
      },
    }),
  );
  const guard = await deadEnd();
  const app = new URL(appUrl);
  // Always with a port: a bare host would let every port of it through.
  const appHost = `${app.hostname}:${app.port || (app.protocol === "https:" ? "443" : "80")}`;
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
      `--proxy-server=http://127.0.0.1:${guard.port}`,
      `--proxy-bypass-list=<-loopback>;${appHost}`,
      // UDP is never proxied, so WebRTC may only use proxied UDP: none.
      "--force-webrtc-ip-handling-policy=disable_non_proxied_udp",
      "about:blank",
    ],
    { stdout: "ignore", stderr: "pipe" },
  );
  const cleanup = async () => {
    proc.kill();
    await proc.exited;
    guard.server.close();
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
  const { wsUrl, cleanup } = await launchChrome(executablePath, options.url);
  // Launched here, so the proxy guard and the WebRTC policy are in force.
  return attach("chromium", wsUrl, options, cleanup, true);
});

/** Lightpanda or any CDP browser already running: PARITY_CDP_URL is its browser WebSocket URL. */
const viaCdp = async (name: string, options: BrowserDriverOptions) => {
  if (!options.cdpUrl) throw new Error("PARITY_CDP_URL is required for this driver");
  // A browser Parity did not launch: only page-level confinement applies.
  return attach(name, options.cdpUrl, options, async () => {}, false);
};
registerBrowser("lightpanda", (options) => viaCdp("lightpanda", options));
registerBrowser("cdp", (options) => viaCdp("cdp", options));
