// Reference screen: one record picked from a list, grouped by meaning. Copy the structure, not the labels.
export async function render(root, kit) {
  const { ui } = kit;
  const records = await kit.data("customers");
  const groups = [
    ["Identity", ["Customer Name:", "Customer Short Name:", "GSTNo:"]],
    ["Contact", ["Address:", "Phone:", "E-mail:"]],
    ["Terms", ["Sales Type/Price List:", "Payment Terms:", "Discount Percent:", "Credit Status:"]],
  ];

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
    // Key figures first, with their exact legacy labels.
    root.append(ui.stats([["Credit Limit:", kit.value(record, "Credit Limit:")]]));
    const used = new Set(["Credit Limit:"]);
    for (const [title, labels] of groups) {
      const fields = record.fields.filter((f) => labels.includes(f.label));
      for (const f of fields) used.add(f.label);
      if (fields.length) root.append(ui.form(title, fields));
    }
    // Every other legacy field stays on the screen.
    const rest = record.fields.filter((f) => !used.has(f.label));
    if (rest.length) root.append(ui.form("Other", rest));
  };
  draw(kit.query.get("customer") ?? "");
}
