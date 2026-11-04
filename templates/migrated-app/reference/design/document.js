// Reference screen: a document with lines and totals (an invoice). Copy the structure, not the labels or the maths.
export async function render(root, kit) {
  const { ui, h } = { ui: kit.ui, h: kit.ui.h };
  const items = await kit.data("items");
  const lines = [];

  const entry = ui.card("New line");
  const code = ui.field("Item Code", "");
  const qty = ui.field("Quantity", "1");
  const add = h("button", { type: "button", text: "Add Item", onclick: () => addLine() });
  entry.body.append(
    ui.grid(code, qty, h("div", { class: "field" }, h("span", { class: "label", text: " " }), add)),
  );
  entry.el.setAttribute("data-group", "entry");

  const linesCard = ui.card("Lines");
  const totals = h("div");

  function addLine() {
    const item = items.find(
      (r) => r.key === code.querySelector("input").value || r.value === code.querySelector("input").value,
    );
    if (!item) return;
    lines.push({ code: item.value, name: item.key, qty: Number(qty.querySelector("input").value) || 1 });
    draw();
  }

  function draw() {
    linesCard.body.replaceChildren(
      ui.table(
        [{ label: "Item Code" }, { label: "Item Description" }, { label: "Quantity", num: true }],
        lines.map((l) => [l.code, l.name, String(l.qty)]),
      ),
    );
    totals.replaceChildren(ui.totals([["Lines", String(lines.length)]]));
  }

  root.append(entry.el, linesCard.el, totals);
  draw();
}
