// Reference screen: one record picked from a list. Picker, identity, key figures, two columns. Copy the structure,
// not the labels.
export async function render(root, kit) {
  const { ui } = kit;
  const records = await kit.data("customers");
  const editable = [
    ["Identity", ["Customer Name:", "Customer Short Name:", "GSTNo:"]],
    ["Contact", ["Address:", "Phone:", "E-mail:"]],
    ["Terms", ["Sales Type/Price List:", "Payment Terms:", "Discount Percent:", "Credit Status:"]],
  ];
  const figures = ["Credit Limit:"];

  const draw = (key) => {
    const record = records.find((r) => r.key === key);
    const picker = ui.picker(
      "Select a customer:",
      records.map((r) => ({ text: r.key, value: r.key })),
      key,
      draw,
    );
    root.replaceChildren(picker);
    kit.subtitle(record ? record.key : "");
    if (!record) {
      root.append(ui.empty("No customer picked yet: press / to pick one."));
      return;
    }
    const v = (label) => kit.value(record, label);
    root.append(
      ui.hero({
        title: v("Customer Name:") || record.key,
        subtitle: [v("Sales Type/Price List:"), v("Payment Terms:")].filter(Boolean).join(" · "),
        pills: [ui.pill(v("Credit Status:") || "Customer", "ok")],
      }),
      ui.stats(figures.map((label) => [label, v(label)])),
    );
    const used = new Set(figures);
    const main = editable.flatMap(([title, labels]) => {
      const fields = record.fields.filter((f) => labels.includes(f.label));
      for (const f of fields) used.add(f.label);
      return fields.length ? [ui.form(title, fields)] : [];
    });
    // Every other legacy field stays on the screen, read-only, in the side column.
    const rest = record.fields.filter((f) => !used.has(f.label));
    root.append(ui.split(main, rest.length ? [ui.details("Other", rest)] : []));
  };
  draw(kit.query.get("customer") ?? "");
}
