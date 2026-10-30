import { afterAll, beforeAll, describe, expect, setDefaultTimeout, test } from "bun:test";
import { loadConfig } from "../src/config";
import { diffScreens } from "../src/diff/diff";
import { openBrowser } from "../src/drivers";
import type { AppDriver } from "../src/drivers/types";
import { addExplored, explore } from "../src/explore/explore";
import { matchScreens } from "../src/fields/match";
import type { ComputerAction, ComputerClient, ComputerRequest, ComputerStep } from "../src/models/types";
import { ProofSchema } from "../src/proof/schema";
import { replay } from "../src/replay/replay";

// Chrome starts cold on CI runners; hooks that launch it need more than the default 5 s.
setDefaultTimeout(60_000);

const link = (href: string, top: number, text: string) =>
  `<a href="${href}" style="position:absolute;left:20px;top:${top}px;width:200px;height:30px">${text}</a>`;
let outside = 0;
const elsewhere = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  fetch: () => {
    outside++;
    return new Response("outside");
  },
});
// UDP is not proxied: a STUN request from WebRTC would reach this socket directly.
let udpPackets = 0;
const udp = await Bun.udpSocket({
  hostname: "127.0.0.1",
  socket: {
    data() {
      udpPackets++;
    },
  },
});
const PAGES: Record<string, string> = {
  "/": `<label>Customer <input value="Donald"></label>${link("/prices", 100, "Price list")}${link(`http://127.0.0.1:${elsewhere.port}/`, 200, "Vendor site")}`,
  // Every way a page can reach another origin besides its own requests: a popup, a WebSocket, a worker, an image.
  "/leaky": `<button onclick="window.open('/rtc')">Open details</button>
    <a href="/rtc" target="_blank">Open in a new tab</a><script>
    const away = "127.0.0.1:${elsewhere.port}";
    window.open("http://" + away + "/popup");
    try { new WebSocket("ws://" + away + "/socket"); } catch {}
    const code = "fetch('http://" + away + "/worker').catch(() => {})";
    new Worker(URL.createObjectURL(new Blob([code], { type: "text/javascript" })));
    new Image().src = "http://localhost:${elsewhere.port}/image";
    try {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:127.0.0.1:${udp.port}" }] });
      pc.createDataChannel("x");
      pc.createOffer().then((o) => pc.setLocalDescription(o));
    } catch {}
    // The same from a popup and from a frame on the app's own origin.
    window.open("/rtc");
    document.body.insertAdjacentHTML("beforeend", '<iframe src="/rtc"></iframe>');
  </script>`,
  "/rtc": `<script>
    try {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:127.0.0.1:${udp.port}" }] });
      pc.createDataChannel("x");
      pc.createOffer().then((o) => pc.setLocalDescription(o));
    } catch {}
  </script>`,
  // An order form: the model clicks the quantity, types, and presses a button that shows the total.
  "/order": `<label style="position:absolute;left:20px;top:100px">Quantity <input id="q" style="width:120px"></label>
    <button id="go" style="position:absolute;left:20px;top:200px;width:150px;height:30px">Compute</button>
    <button style="position:absolute;left:20px;top:300px;width:150px;height:30px">Compute again</button>
    <script>document.getElementById("go").onclick = () => document.body.insertAdjacentHTML("beforeend",
      '<label>Net amount <output data-field="Net amount">' + (Number(document.getElementById("q").value) * 12.5).toFixed(2) + '</output></label>' +
      '<label>Delivery <output data-field="Delivery">tomorrow</output></label>');</script>`,
  "/prices": `<label>Item <input value="101"></label><label>Unit price <input value="300.00"></label><label>Tax rate <input value="5%"></label>`,
};

let server: ReturnType<typeof Bun.serve>;
let driver: AppDriver;
let origin: string;

beforeAll(async () => {
  server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch: (req) => {
      const html = PAGES[new URL(req.url).pathname];
      return html
        ? new Response(`<!doctype html><title>t</title>${html}`, { headers: { "content-type": "text/html" } })
        : new Response("no", { status: 404 });
    },
  });
  origin = `http://127.0.0.1:${server.port}`;
  driver = await openBrowser(loadConfig(), { url: `${origin}/` });
});

afterAll(async () => {
  await driver.close();
  server.stop(true);
  elsewhere.stop(true);
  udp.close();
});

/** A scripted stand-in for Muse Spark: each call returns the next batch of actions, then stops. */
function scripted(batches: ComputerAction[][], final = "done"): ComputerClient & { calls: number } {
  const client = {
    calls: 0,
    async step(): Promise<ComputerStep> {
      const actions = batches[client.calls++];
      const call = {
        id: client.calls,
        at: "",
        costUsd: 0.01,
        role: "computer",
        provider: "test",
        model: "fake",
        usage: {},
        sentBytes: 0,
        durationMs: 0,
        ok: true,
      };
      return actions
        ? { responseId: `r${client.calls}`, callId: `c${client.calls}`, actions, safetyChecks: [], call }
        : { responseId: `r${client.calls}`, actions: [], safetyChecks: [], text: final, call };
    },
  };
  return client;
}

const known = [{ id: "home", app: "a", fields: [{ id: "c", label: "Customer", value: "Donald" }] }];

describe("egress", () => {
  test("popups, WebSockets, workers and other hostnames cannot reach another origin", async () => {
    const before = outside;
    await driver.reset();
    await driver.perform({ do: "open", path: "/leaky" });
    // A user gesture, like the clicks of an exploring model, is what lets a popup through Chrome's blocker.
    await driver.perform({ do: "click", target: "Open details" });
    await driver.perform({ do: "click", target: "Open in a new tab" });
    await new Promise((r) => setTimeout(r, 1500));
    expect(outside - before).toBe(0);
    expect(udpPackets).toBe(0);
  });
});

describe("exploration", () => {
  test("a screen with new fields is kept as a finding, and the model's stop ends the run", async () => {
    const model = scripted([[{ type: "click", x: 60, y: 110, button: "left" }]]);
    const run = await explore(driver, model, {
      setup: [{ do: "open", path: "/" }],
      known,
      goal: "find prices",
      maxSteps: 5,
      maxCostUsd: 1,
      origin,
    });
    expect(run.stoppedBecause).toBe("done");
    expect(run.found.map((f) => f.location)).toEqual([`${origin}/prices`]);
    expect(run.found[0]?.labels).toContain("unit price");
    expect(run.costUsd).toBeCloseTo(0.02);
  });

  test("a click that tries to leave the app is refused by the browser and ends the run", async () => {
    const model = scripted([[{ type: "click", x: 60, y: 210, button: "left" }], []]);
    const run = await explore(driver, model, {
      setup: [{ do: "open", path: "/" }],
      known,
      goal: "x",
      maxSteps: 5,
      maxCostUsd: 1,
      origin,
    });
    expect(run.stoppedBecause).toBe("left-the-app");
    expect(outside).toBe(0);
  });

  test("max steps bounds the spend", async () => {
    const wait: ComputerAction[] = [{ type: "wait" }];
    const model = scripted([wait, wait, wait, wait, wait]);
    const run = await explore(driver, model, {
      setup: [{ do: "open", path: "/" }],
      known,
      goal: "x",
      maxSteps: 2,
      maxCostUsd: 1,
      origin,
    });
    expect(run.stoppedBecause).toBe("max-steps");
    expect(model.calls).toBe(2);
  });

  test("the cost cap stops the run before the next call", async () => {
    const wait: ComputerAction[] = [{ type: "wait" }];
    const model = scripted([wait, wait, wait, wait, wait]);
    const run = await explore(driver, model, {
      setup: [{ do: "open", path: "/" }],
      known,
      goal: "x",
      maxSteps: 5,
      maxCostUsd: 0.025,
      origin,
    });
    expect(run.stoppedBecause).toBe("max-cost");
    expect(model.calls).toBe(3);
  });

  test("a safety code listed by the operator is acknowledged on the next call and recorded", async () => {
    const seen: (ComputerRequest["previous"] | undefined)[] = [];
    let n = 0;
    const call = {
      id: 1,
      at: "",
      costUsd: 0,
      role: "computer",
      provider: "t",
      model: "f",
      usage: {},
      sentBytes: 0,
      durationMs: 0,
      ok: true,
    };
    const model: ComputerClient = {
      async step(req) {
        seen.push(req.previous);
        n++;
        if (n === 1)
          return {
            responseId: "r1",
            callId: "c1",
            actions: [{ type: "click", x: 60, y: 110, button: "left" }],
            safetyChecks: [{ id: "s1", code: "computer_action_requires_confirmation", message: "confirm" }],
            call,
          };
        return { responseId: "r2", actions: [], safetyChecks: [], text: "done", call };
      },
    };
    const run = await explore(driver, model, {
      setup: [{ do: "open", path: "/" }],
      known,
      goal: "x",
      maxSteps: 3,
      maxCostUsd: 1,
      origin,
      acknowledge: ["computer_action_requires_confirmation"],
    });
    expect(run.stoppedBecause).toBe("done");
    expect(run.acknowledged).toHaveLength(1);
    expect(seen[1]?.acknowledged?.[0]?.id).toBe("s1");
    expect(run.found.map((f) => f.location)).toEqual([`${origin}/prices`]);
    // An acknowledged action is never saved as a test that replays it unless the operator approves it apart.
    expect(run.found[0]).toMatchObject({
      steps: [{ do: "click", target: "Price list" }],
      acknowledged: true,
    });
    const empty = ProofSchema.parse({
      format: "parity-proof",
      version: 1,
      createdAt: "2026-10-30T00:00:00Z",
      reference: { app: "ref", source: "replay" },
      scenarios: [],
      checkpoints: [],
    });
    expect(addExplored(empty, [], run, "x")).toMatchObject({ added: [], held: 1 });
    expect(addExplored(empty, [], run, "x", { acknowledged: true }).added).toHaveLength(1);
  });

  test("a browser Parity did not launch is refused for exploration", async () => {
    const remote = Object.assign(Object.create(Object.getPrototypeOf(driver)), driver, { confined: false });
    await expect(
      explore(remote, scripted([]), { setup: [], known, goal: "x", maxSteps: 1, maxCostUsd: 1, origin }),
    ).rejects.toThrow("needs a browser Parity launched itself");
  });

  test("acknowledging is refused for an app that is not on this machine", async () => {
    await expect(
      explore(driver, scripted([]), {
        setup: [],
        known,
        goal: "x",
        maxSteps: 1,
        maxCostUsd: 1,
        origin: "https://erp.example.com",
        acknowledge: ["computer_action_requires_confirmation"],
      }),
    ).rejects.toThrow("only acknowledged for an app on this machine");
  });

  test("a safety check is never acknowledged for the model", async () => {
    const model: ComputerClient = {
      async step() {
        return {
          responseId: "r",
          callId: "c",
          actions: [],
          safetyChecks: [{ id: "s", code: "sensitive_domain", message: "check" }],
          call: {
            id: 1,
            at: "",
            costUsd: 0,
            role: "computer",
            provider: "t",
            model: "f",
            usage: {},
            sentBytes: 0,
            durationMs: 0,
            ok: true,
          },
        };
      },
    };
    const run = await explore(driver, model, {
      setup: [{ do: "open", path: "/" }],
      known,
      goal: "x",
      maxSteps: 3,
      maxCostUsd: 1,
      origin,
    });
    expect(run.stoppedBecause).toBe("safety-check");
  });
});

describe("exploration that writes tests", () => {
  const proof = ProofSchema.parse({
    format: "parity-proof",
    version: 1,
    createdAt: "2026-10-30T00:00:00Z",
    reference: { app: "ref", source: "replay" },
    scenarios: [],
    checkpoints: [],
  });

  test("what the model did becomes steps by labels, and the screen it found a scenario that replays", async () => {
    const model = scripted([
      [
        { type: "click", x: 120, y: 110, button: "left" },
        { type: "type", text: "4" },
        { type: "type", text: "0" },
        { type: "click", x: 60, y: 215, button: "left" },
      ],
    ]);
    const setup = [{ do: "open" as const, path: "/order" }];
    const run = await explore(driver, model, { setup, known, goal: "x", maxSteps: 3, maxCostUsd: 1, origin });
    expect(run.found).toHaveLength(1);
    expect(run.found[0]?.steps).toEqual([
      { do: "fill", field: "Quantity", value: "40" },
      { do: "click", target: "Compute" },
    ]);

    const { proof: next, added } = addExplored(proof, setup, run, "Order");
    expect(added).toHaveLength(1);
    const scenario = next.scenarios[0];
    expect(scenario?.steps.at(-1)).toMatchObject({ do: "check", screen: added[0] });
    expect(next.checkpoints[0]?.screen.fields.find((f) => f.label === "Net amount")?.value).toBe("500.00");
    expect(addExplored(next, setup, run, "Order").added).toEqual([]);

    // Replayed by Parity alone, no model: the same screen with the same values.
    const [again] = await replay(driver, scenario as NonNullable<typeof scenario>);
    const diff = diffScreens(matchScreens(next.checkpoints[0]?.screen as never, again?.screen as never));
    expect(diff.counts.different).toBe(0);
    expect(diff.missingInRebuilt).toEqual([]);
  });

  test("a drag cannot be said with labels: the screen is kept, without a scenario", async () => {
    const model = scripted([
      [
        { type: "click", x: 120, y: 110, button: "left" },
        { type: "type", text: "2" },
        { type: "click", x: 60, y: 215, button: "left" },
        { type: "drag", path: [{ x: 1, y: 1 }] },
      ],
    ]);
    const run = await explore(driver, model, {
      setup: [{ do: "open", path: "/order" }],
      known,
      goal: "x",
      maxSteps: 3,
      maxCostUsd: 1,
      origin,
    });
    expect(run.found).toHaveLength(1);
    expect(run.found[0]?.steps).toBeUndefined();
    expect(addExplored(proof, [], run, "Order")).toMatchObject({ added: [], skipped: 1 });
  });
});
