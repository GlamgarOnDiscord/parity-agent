import { join, relative } from "node:path";
import { z } from "zod";
import type { Inventory } from "../migrate/inventory";
import { type Migration, MigrationSchema } from "../migrate/migrate";
import { isInternal } from "../migrate/records";
import { spawnLines } from "./repair";
import { esc, shell } from "./ui";

/** What a person types on the first step: where the old app is and, if it has one, how to log in. */
export const NewAppSchema = z.object({
  name: z.string().regex(/^[a-z0-9-]{1,40}$/, "a short name: lowercase letters, digits and dashes"),
  title: z.string().trim().min(1).max(80),
  url: z.url().refine((u) => /^https?:\/\//.test(u), "a web address (http or https)"),
  login: z
    .object({
      userField: z.string().trim().min(1).max(80).default("User name"),
      user: z.string().max(200),
      passwordField: z.string().trim().min(1).max(80).default("Password"),
      password: z.string().max(200),
      button: z.string().trim().min(1).max(80).default("Login"),
    })
    .optional(),
});
export type NewApp = z.infer<typeof NewAppSchema>;

/** The migration file before any screen is picked: enough to crawl the app. */
export function draft(n: NewApp): Migration {
  const setup: Migration["setup"] = [{ do: "open", path: "/" }];
  if (n.login) {
    setup.push(
      { do: "fill", field: n.login.userField, value: n.login.user },
      { do: "fill", field: n.login.passwordField, value: n.login.password },
      { do: "click", target: n.login.button },
    );
  }
  return MigrationSchema.parse({
    name: n.name,
    title: n.title,
    url: n.url,
    setup,
    start: ["/"],
    entities: [],
    screens: [],
  });
}

export const PicksSchema = z.object({
  picks: z
    .array(z.object({ path: z.string().max(300), selector: z.string().max(120) }))
    .min(1, "pick at least one screen")
    .max(30),
});

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32) || "screen";

/**
 * Each screen picked becomes an entity (its records, read through its list) and a screen to rebuild. A list known
 * only by its form name opens its records by address, with that name as the query parameter.
 */
export function withScreens(
  m: Migration,
  inv: Inventory,
  picks: z.infer<typeof PicksSchema>["picks"],
): Migration {
  const entities: Migration["entities"] = [];
  const screens: Migration["screens"] = [];
  for (const p of picks) {
    const s = inv.screens.find((x) => x.path === p.path);
    if (!s?.selectors.some((x) => x.field === p.selector))
      throw new Error(`${p.path} has no list "${p.selector}"`);
    const title = s.name || s.title || s.path;
    let id = slug(title);
    while (entities.some((e) => e.id === id)) id = `${id}-2`.slice(0, 40);
    const param = isInternal(p.selector) ? p.selector.replace(/[\s:]+$/, "") : undefined;
    entities.push({ id, path: s.path, selector: p.selector, ...(param ? { param } : {}) });
    screens.push({ id, title, menu: s.menu, entity: id, uses: [] });
  }
  return MigrationSchema.parse({ ...m, entities, screens });
}

export interface WizardJob {
  name: string;
  step: "inventory" | "prepare" | "run";
  state: "running" | "done" | "failed";
  log: string[];
}

/** `parity migrate` started from the page: one at a time, fixed arguments, the migration file of that run only. */
export class MigrateJobs {
  private current: WizardJob | null = null;

  constructor(
    private readonly root: string,
    private readonly runsDir: string,
    private readonly spawn = spawnLines,
  ) {}

  status(name: string): WizardJob | null {
    return this.current?.name === name ? this.current : null;
  }

  busy(): boolean {
    return this.current?.state === "running";
  }

  start(name: string, step: WizardJob["step"], budgetUsd?: number): WizardJob | string {
    if (this.current?.state === "running")
      return `${this.current.step} of ${this.current.name} is still running`;
    const file = relative(this.root, join(this.runsDir, name, "migration.json")).replaceAll("\\", "/");
    const cmd = [process.execPath, join(this.root, "bin", "parity.ts"), "migrate", step, file];
    if (step === "run") {
      if (!(budgetUsd && budgetUsd > 0 && budgetUsd <= 100))
        return "a budget between $0.01 and $100 is needed";
      cmd.push("--budget", budgetUsd.toFixed(2), "--yes");
    }
    const job: WizardJob = { name, step, state: "running", log: [] };
    this.current = job;
    (async () => {
      const p = this.spawn(cmd, this.root);
      for await (const line of p.lines) {
        job.log.push(line);
        if (job.log.length > 200) job.log.shift();
      }
      job.state = (await p.exited) === 0 ? "done" : "failed";
    })().catch((error: unknown) => {
      job.log.push(String(error));
      job.state = "failed";
    });
    return job;
  }
}

const CSS = `
.wiz { max-width: 860px; padding: 28px 28px 64px; display: grid; gap: 18px; }
.wiz h1 { font-size: 26px; margin: 0; font-weight: 600; letter-spacing: -0.01em; }
.wiz .lead { color: var(--t2); margin: 6px 0 0; max-width: 62ch; }
.step { padding: 20px 22px; display: grid; gap: 14px; }
.step header { display: flex; align-items: baseline; gap: 12px; }
.step header b { font-family: var(--mono); color: var(--blue-hi); }
.step h2 { margin: 0; font-size: 16px; font-weight: 600; }
.step[aria-disabled="true"] { opacity: .45; pointer-events: none; }
.row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.wiz label { display: grid; gap: 6px; font-size: 12px; color: var(--t2); }
.wiz input { font: inherit; font-size: 14px; color: var(--t1); background: var(--app); border: 1px solid var(--line-2); border-radius: 8px; padding: 9px 11px; }
.wiz input:focus { outline: 2px solid rgba(76, 111, 255, .35); border-color: var(--blue); }
.wiz details summary { cursor: pointer; color: var(--t2); font-size: 13px; }
.wiz details[open] summary { margin-bottom: 12px; }
.go { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.go button { font: inherit; font-weight: 500; border-radius: 8px; padding: 9px 16px; cursor: pointer; border: 1px solid var(--blue-btn); background: var(--blue-btn); color: #fff; }
.go button.ghost { background: transparent; color: var(--t1); border-color: var(--line-2); }
.go button:disabled { opacity: .5; cursor: default; }
.go .note { color: var(--t3); font-size: 12px; }
.screens { display: grid; gap: 6px; max-height: 360px; overflow: auto; }
.screens label { display: flex; gap: 10px; align-items: center; color: var(--t1); font-size: 13px; padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; }
.screens label span { color: var(--t3); font-family: var(--mono); font-size: 12px; margin-left: auto; }
pre.log { margin: 0; max-height: 220px; overflow: auto; font: 12px/1.5 var(--mono); color: var(--t2); background: var(--app); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; white-space: pre-wrap; }
.err { color: #fca5a5; font-size: 13px; min-height: 1em; margin: 0; }
.err.ok { color: #86efac; }
.wiz .note { color: var(--t3); font-size: 12px; margin: 0; }
@media (max-width: 640px) { .row2 { grid-template-columns: 1fr; } .wiz { padding: 18px 16px 48px; } }
`;

const SCRIPT = `
const $ = (id) => document.getElementById(id);
let name = "";
const api = async (path, body) => {
  const r = await fetch(path, body === undefined ? {} : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || r.status);
  return data;
};
const say = (id, text, ok) => { $(id).textContent = text; $(id).classList.toggle("ok", !!ok); };
const enable = (id, on) => $(id).setAttribute("aria-disabled", on ? "false" : "true");
async function follow(done) {
  for (;;) {
    const s = await api("/api/new/" + name);
    $("log").hidden = false;
    $("log").textContent = (s.job?.log || []).join("\\n");
    $("log").scrollTop = 1e9;
    if (!s.job || s.job.state !== "running") return done(s);
    await new Promise((r) => setTimeout(r, 1500));
  }
}
$("find").onclick = async () => {
  say("err1", "");
  const login = $("user").value ? { userField: $("userField").value, user: $("user").value, passwordField: $("passwordField").value, password: $("password").value, button: $("button").value } : undefined;
  name = $("name").value.trim();
  try {
    $("find").disabled = true;
    await api("/api/new", { name, title: $("title").value.trim() || name, url: $("url").value.trim(), login });
    await follow((s) => {
      $("find").disabled = false;
      if (!s.inventory) return say("err1", "No screen found. Check the address and the login.");
      const lists = s.inventory.screens.filter((x) => x.selectors.length);
      if (!lists.length) return say("err1", s.inventory.screens.length + " screens found, but none picks a record from a list: Parity cannot read their data yet.");
      say("found", s.inventory.screens.length + " screens found, " + lists.length + " show records picked from a list.");
      $("screens").replaceChildren(...lists.map((x) => {
        const l = document.createElement("label");
        const c = document.createElement("input");
        c.type = "checkbox"; c.dataset.path = x.path; c.dataset.selector = x.selectors[0].field;
        const t = document.createElement("b"); t.textContent = x.name || x.title || x.path;
        const p = document.createElement("span"); p.textContent = x.path;
        l.append(c, t, p);
        return l;
      }));
      enable("s2", true);
    });
  } catch (e) { $("find").disabled = false; say("err1", e.message); }
};
$("all").onclick = () => document.querySelectorAll("#screens input").forEach((c) => { c.checked = true; });
$("pick").onclick = async () => {
  say("err2", "");
  const picks = [...document.querySelectorAll("#screens input:checked")].map((c) => ({ path: c.dataset.path, selector: c.dataset.selector }));
  try {
    const s = await api("/api/new/" + name + "/screens", { picks });
    say("plan", s.screens + (s.screens === 1 ? " screen" : " screens") + ". Reading their records is free. Rebuilding them with Muse Code costs about $" + s.expected.toFixed(2) + ", at most $" + s.upTo.toFixed(2) + ".");
    $("budget").value = Math.ceil(s.upTo);
    enable("s3", true);
  } catch (e) { say("err2", e.message); }
};
$("prepare").onclick = async () => {
  say("err3", "");
  try {
    await api("/api/new/" + name + "/prepare", {});
    await follow((s) => say("err3", s.job.state === "done" ? "Records read and the app laid out: nothing spent." : "Reading the records failed: see the log.", s.job.state === "done"));
  } catch (e) { say("err3", e.message); }
};
let armed = false;
$("run").onclick = async () => {
  const budget = Number($("budget").value);
  if (!armed) { armed = true; $("run").textContent = "Confirm: spend up to $" + budget.toFixed(2); return; }
  armed = false; $("run").textContent = "Rebuild with Muse Code";
  say("err3", "");
  try {
    await api("/api/new/" + name + "/run", { budget });
    await follow((s) => { $("board").hidden = false; $("board").href = "/migrate/" + name; say("err3", s.job.state === "done" ? "Done: open the board to see every screen and its proof." : "Stopped: see the log and the board.", s.job.state === "done"); });
  } catch (e) { say("err3", e.message); }
};
`;

/** Rebuild a program in three steps: where it is, which screens, go. */
export function wizardPage(): string {
  return shell({
    title: "Rebuild an app",
    run: "",
    active: "new",
    css: CSS,
    script: SCRIPT,
    body: `<div class="top"><span class="crumbs">Rebuild an app</span></div>
<div class="wiz">
<div><h1>Rebuild an old app, screen by screen</h1>
<p class="lead">Parity finds the screens of your app, reads its records the way a person would, has Muse Code rebuild each screen in a modern template, and proves every field matches. The first two steps are free.</p></div>

<section class="card step" id="s1"><header><b>1</b><h2>Where is the old app?</h2></header>
<div class="row2"><label>Web address<input id="url" placeholder="http://127.0.0.1:8080/" autocomplete="off"></label>
<label>Name of this migration<input id="name" placeholder="crm" autocomplete="off"></label></div>
<label>What the app is called<input id="title" placeholder="Our CRM"></label>
<details><summary>It asks for a login</summary><div class="row2">
<label>Label of the user field<input id="userField" value="User name"></label><label>User<input id="user" autocomplete="off"></label>
<label>Label of the password field<input id="passwordField" value="Password"></label><label>Password<input id="password" type="password" autocomplete="off"></label>
<label>Login button<input id="button" value="Login"></label></div>
<p class="note">Use a test account: the login is kept in ${esc("runs/<name>/migration.json")} on this machine.</p></details>
<div class="go"><button id="find">Find its screens</button><span class="note">Free: Parity follows the app's links, never one that deletes or posts.</span></div>
<p class="err" id="err1"></p></section>

<section class="card step" id="s2" aria-disabled="true"><header><b>2</b><h2>Which screens should be rebuilt?</h2></header>
<p class="note" id="found"></p><div class="screens" id="screens"></div>
<div class="go"><button class="ghost" id="all">Select all</button><button id="pick">Use these screens</button></div><p class="err" id="err2"></p></section>

<section class="card step" id="s3" aria-disabled="true"><header><b>3</b><h2>Go</h2></header>
<p id="plan" class="note"></p>
<div class="go"><button class="ghost" id="prepare">Read the records (free)</button>
<label style="display:flex;align-items:center;gap:8px">Budget, USD <input id="budget" type="number" min="1" max="100" step="1" style="width:90px"></label>
<button id="run">Rebuild with Muse Code</button><a id="board" class="btn" hidden style="color:var(--blue-hi)">Open the board</a></div>
<p class="err" id="err3"></p></section>

<pre class="log" id="log" hidden></pre>
</div>`,
  });
}
