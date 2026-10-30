// Parity migration template: router, migrated data, and the UI kit every screen is built from. Screens live in
// /screens/<id>.js and export `render(root, kit)`; /screens.json lists them with the legacy address each answers.
(() => {
  let nextId = 0;
  const h = (tag, attrs = {}, ...children) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (k === "text") el.textContent = v;
      else el.setAttribute(k, v === true ? "" : String(v));
    }
    for (const c of children.flat()) if (c !== null && c !== undefined) el.append(c);
    return el;
  };

  const json = async (url) => {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${url}: ${r.status}`);
    return r.json();
  };

  // Every input has a <label for> with the field's label; every read-only value is an <output data-field>.
  const ui = {
    h,
    card(title, ...children) {
      const body = h("div", { class: "body" }, ...children);
      return { el: h("section", { class: "card" }, title ? h("h2", { text: title }) : null, body), body };
    },
    grid(...children) {
      return h("div", { class: "grid" }, ...children);
    },
    field(label, value, opts = {}) {
      const id = `f${++nextId}`;
      let input;
      if (opts.choices) {
        input = h(
          "select",
          { id, name: opts.name, onchange: opts.onchange, disabled: opts.readOnly },
          ...opts.choices.map((c) => {
            const text = typeof c === "string" ? c : c.text;
            const v = typeof c === "string" ? c : c.value;
            return h("option", { value: v, selected: text === value || v === value, text });
          }),
        );
      } else if (opts.kind === "checkbox") {
        input = h("input", {
          id,
          type: "checkbox",
          checked: value === true || value === "true",
          disabled: opts.readOnly,
        });
      } else if (opts.kind === "textarea") {
        input = h("textarea", { id, rows: 3, readonly: opts.readOnly });
        input.value = value ?? "";
      } else {
        input = h("input", {
          id,
          type: "text",
          readonly: opts.readOnly,
          inputmode: opts.numeric ? "decimal" : undefined,
        });
        input.value = value ?? "";
      }
      if (opts.group) input.setAttribute("data-group", opts.group);
      return h("div", { class: "field" }, h("label", { for: id, text: label }), input);
    },
    output(label, value, opts = {}) {
      return h(
        "div",
        { class: "field" },
        h("span", { class: "label", text: label }),
        h("output", { "data-field": label, "data-group": opts.group, text: value ?? "" }),
      );
    },
    /** The list that picks a record, above the form; picking reloads the screen with that record. */
    picker(label, choices, selected, onPick) {
      return h(
        "div",
        { class: "picker" },
        ui.field(label, selected, { choices, onchange: (e) => onPick(e.target.value) }),
      );
    },
    /** A grid: one <tr data-group="row-N"> per line, each cell an <output data-field="Column">. */
    table(columns, rows) {
      if (rows.length === 0) return h("div", { class: "empty", text: "Nothing here yet." });
      return h(
        "table",
        {},
        h(
          "thead",
          {},
          h("tr", {}, ...columns.map((c) => h("th", { class: c.num ? "num" : undefined, text: c.label }))),
        ),
        h(
          "tbody",
          {},
          ...rows.map((row, i) =>
            h(
              "tr",
              { "data-group": `row-${i + 1}` },
              ...columns.map((c, j) =>
                h(
                  "td",
                  { class: c.num ? "num" : undefined },
                  h("output", { "data-field": c.label, text: row[j] ?? "" }),
                ),
              ),
            ),
          ),
        ),
      );
    },
    totals(pairs) {
      return h(
        "div",
        { class: "totals" },
        ...pairs.flatMap(([label, value]) => [
          h("span", { class: "label", text: label }),
          h("output", { "data-field": label, text: value }),
        ]),
      );
    },
    empty(text) {
      return h("div", { class: "empty", text });
    },
  };

  const kit = {
    ui,
    /** Every migrated record of an entity, in the legacy app's order: [{ key, value, fields: [{ label, value, group? }] }]. */
    data: (entity) => json(`/api/data/${encodeURIComponent(entity)}`),
    /** One record, by the value or the displayed text of its choice. */
    record: (entity, key) => json(`/api/data/${encodeURIComponent(entity)}/${encodeURIComponent(key)}`),
    /** A field of a record, by label, ignoring a trailing colon. */
    value(record, label, group) {
      const want = label.replace(/[\s:]+$/, "");
      const f = record?.fields?.find(
        (x) => x.label.replace(/[\s:]+$/, "") === want && (group === undefined || x.group === group),
      );
      return f ? f.value : "";
    },
    query: new URLSearchParams(location.search),
    go(path) {
      location.assign(path);
    },
  };
  window.parity = kit;

  async function start() {
    const screens = await json("/screens.json").catch(() => []);
    const nav = document.getElementById("nav");
    const menus = [...new Set(screens.map((s) => s.menu || "Screens"))];
    for (const m of menus) {
      nav.append(h("h2", { text: m }));
      for (const s of screens.filter((x) => (x.menu || "Screens") === m)) {
        nav.append(
          h("a", {
            class: "item",
            href: s.path,
            "aria-current": location.pathname === s.path.split("?")[0] ? "page" : undefined,
            text: s.title,
          }),
        );
      }
    }
    const here =
      screens.find((s) => s.path.split("?")[0] === location.pathname) ??
      (location.pathname === "/" ? screens[0] : undefined);
    const root = document.getElementById("screen");
    if (!here) {
      root.append(ui.empty("This screen is not part of the migration."));
      return;
    }
    document.getElementById("screen-title").textContent = here.title;
    document.title = here.title;
    try {
      const mod = await import(`/screens/${here.id}.js`);
      await mod.render(root, kit);
    } catch (error) {
      root.append(h("div", { class: "error", text: `This screen failed to load: ${error.message}` }));
    }
  }
  start();
})();
