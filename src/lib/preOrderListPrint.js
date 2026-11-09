const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

const formatItems = (order) =>
  (order.items || [])
    .map((i) => `${i.quantity}× ${i.name}${i.size ? ` (${i.size})` : ""}`)
    .join("<br>") || "—";

const formatTime = (time) => {
  if (!time) return "";
  const [h, m] = String(time).split(":").map(Number);
  if (Number.isNaN(h)) return time;
  return `${h % 12 || 12}:${String(Number.isNaN(m) ? 0 : m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

export function printPreOrderList(sale, orders) {
  const rows = (orders || []).filter((o) => o.status !== "cancelled");
  if (rows.length === 0) return;

  const paidCount = rows.filter((o) => o.paid).length;
  const total = rows.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const unpaid = rows.filter((o) => !o.paid).reduce((sum, o) => sum + Number(o.total || 0), 0);

  const productTotals = [];
  const byName = new Map();
  rows.forEach((o) =>
    (o.items || []).forEach((i) => {
      const name = i.name || "Item";
      const qty = Number(i.quantity || 0);
      if (!byName.has(name)) byName.set(name, { name, qty: 0, sizes: new Map() });
      const entry = byName.get(name);
      entry.qty += qty;
      if (i.size) entry.sizes.set(i.size, (entry.sizes.get(i.size) || 0) + qty);
    })
  );
  byName.forEach((entry) => productTotals.push(entry));
  productTotals.sort((a, b) => b.qty - a.qty);
  const itemCount = productTotals.reduce((sum, p) => sum + p.qty, 0);

  const totalsRows = productTotals
    .map((p) => {
      const sizeLines = [...p.sizes.entries()]
        .map(([size, qty]) => `<div class="sub">${escapeHtml(size)}: ${qty}</div>`)
        .join("");
      return `<tr><td><div class="name">${escapeHtml(p.name)}</div>${sizeLines}</td><td class="num qty">${p.qty}</td></tr>`;
    })
    .join("");

  const byTime = (a, b) =>
    (a.pickup_time || "99:99").localeCompare(b.pickup_time || "99:99") ||
    (a.buyer_name || "").localeCompare(b.buyer_name || "");

  const deliveries = rows.filter((o) => o.fulfillment === "delivery");
  const pickups = rows.filter((o) => o.fulfillment !== "delivery");

  const orderRow = (o, { withTime = false, instructions = false } = {}) => `
      <tr>
        ${withTime ? `<td class="time">${o.pickup_time ? escapeHtml(formatTime(o.pickup_time)) : "—"}</td>` : ""}
        <td>
          <div class="name">${escapeHtml(o.buyer_name || "—")}</div>
          ${o.phone ? `<div class="sub">${escapeHtml(o.phone)}</div>` : ""}
          ${instructions && o.delivery_instructions ? `<div class="sub">Leave: ${escapeHtml(o.delivery_instructions)}</div>` : ""}
        </td>
        <td class="items">${formatItems(o)}</td>
        <td class="num">${money(o.total)}</td>
        <td class="paid">${o.paid ? "Paid" : "&nbsp;"}</td>
      </tr>`;

  const groupBlock = (title, list, columns, options) => `
    <div class="group">
      <h3 class="group-title">${escapeHtml(title)} <span class="group-count">${list.length} order${list.length === 1 ? "" : "s"}</span></h3>
      <table>
        <thead><tr>${columns.map((c) => `<th${c.cls ? ` class="${c.cls}"` : ""}>${c.label}</th>`).join("")}</tr></thead>
        <tbody>${list.map((o) => orderRow(o, options)).join("")}</tbody>
      </table>
    </div>`;

  const deliveryGroups = new Map();
  deliveries.forEach((o) => {
    const key = (o.delivery_address || "").trim() || "No address given";
    if (!deliveryGroups.has(key)) deliveryGroups.set(key, []);
    deliveryGroups.get(key).push(o);
  });
  const deliveriesHtml = [...deliveryGroups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([location, list]) =>
      groupBlock(location, [...list].sort(byTime), [
        { label: "Time", cls: "time" },
        { label: "Name" },
        { label: "What They Ordered" },
        { label: "Total", cls: "num" },
        { label: "Paid", cls: "paid" },
      ], { withTime: true, instructions: true })
    )
    .join("");

  const pickupGroups = new Map();
  pickups.forEach((o) => {
    const key = o.pickup_time || "";
    if (!pickupGroups.has(key)) pickupGroups.set(key, []);
    pickupGroups.get(key).push(o);
  });
  const pickupsHtml = [...pickupGroups.entries()]
    .sort((a, b) => (a[0] || "99:99").localeCompare(b[0] || "99:99"))
    .map(([time, list]) =>
      groupBlock(time ? formatTime(time) : "No time given", [...list].sort((a, b) => (a.buyer_name || "").localeCompare(b.buyer_name || "")), [
        { label: "Name" },
        { label: "What They Ordered" },
        { label: "Total", cls: "num" },
        { label: "Paid", cls: "paid" },
      ])
    )
    .join("");

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(sale?.title || "Pre-Orders")}</title>
  <style>
    @page { margin: 0.5in; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #0b2545; margin: 0; padding: 24px; }
    header { border-bottom: 3px solid #c8102e; padding-bottom: 10px; margin-bottom: 14px; }
    .local { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #64748b; }
    h1 { font-size: 20px; margin: 4px 0 2px; }
    .meta { font-size: 11px; color: #475569; }
    .summary { display: flex; gap: 18px; font-size: 11px; margin-bottom: 12px; }
    .summary span { color: #475569; }
    .summary strong { color: #0b2545; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    th { text-align: left; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; }
    td { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: top; }
    .num { width: 60px; text-align: right; }
    .name { font-weight: bold; }
    .time { width: 72px; font-weight: bold; white-space: nowrap; }
    .section-title { margin: 22px 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #c8102e; border-bottom: 2px solid #c8102e; padding-bottom: 4px; }
    .section-title:first-of-type { margin-top: 6px; }
    .group { margin-bottom: 14px; page-break-inside: avoid; }
    .group-title { margin: 0 0 4px; font-size: 12px; background: #e2e8f0; border: 1px solid #cbd5e1; border-bottom: none; padding: 6px 8px; }
    .group-count { float: right; font-weight: normal; font-size: 10px; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; }
    .empty { font-size: 11px; color: #64748b; margin: 0 0 8px; }
    .sub { font-size: 10px; color: #475569; margin-top: 1px; }
    .items { line-height: 1.4; }
    .paid { width: 44px; text-align: center; font-size: 10px; font-weight: bold; }
    .paid { border-left: 2px solid #cbd5e1; }
    .totals { width: 100%; border-collapse: collapse; font-size: 11px; page-break-inside: avoid; }
    .totals th { background: #f1f5f9; }
    .totals .qty { width: 60px; font-weight: bold; }
    .totals-title { margin: 20px 0 6px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; }
    footer { margin-top: 14px; font-size: 10px; color: #64748b; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <header>
    <div class="local">CWA Local 6143</div>
    <h1>${escapeHtml(sale?.title || "Pre-Order List")}</h1>
    <div class="meta">Printed ${new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })}</div>
  </header>
  <div class="summary">
    <span>Orders: <strong>${rows.length}</strong></span>
    <span>Paid: <strong>${paidCount}</strong></span>
    <span>Not paid: <strong>${rows.length - paidCount}</strong></span>
    <span>Order total: <strong>${money(total)}</strong></span>
    <span>Outstanding: <strong>${money(unpaid)}</strong></span>
  </div>
  <h2 class="section-title">Deliveries &mdash; ${deliveries.length}</h2>
  ${deliveriesHtml || '<p class="empty">No deliveries for this sale.</p>'}
  <h2 class="section-title">Pick-Ups &mdash; ${pickups.length}</h2>
  ${pickupsHtml || '<p class="empty">No pick-ups for this sale.</p>'}
  <h2 class="totals-title">Product totals &mdash; ${itemCount} item${itemCount === 1 ? "" : "s"}</h2>
  <table class="totals">
    <thead>
      <tr><th>Product</th><th class="num qty">Qty</th></tr>
    </thead>
    <tbody>${totalsRows}</tbody>
  </table>
  <footer>Check off the Paid column as payments are collected.</footer>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) {
    alert("Allow pop-ups for this site to print the order list.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}