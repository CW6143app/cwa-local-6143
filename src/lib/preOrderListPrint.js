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

  const body = rows
    .map(
      (o, index) => `
      <tr>
        <td class="num">${index + 1}</td>
        <td>
          <div class="name">${escapeHtml(o.buyer_name || "—")}</div>
          ${o.phone ? `<div class="sub">${escapeHtml(o.phone)}</div>` : ""}
        </td>
        <td>
          <div class="type">${o.fulfillment === "delivery" ? "Delivery" : "Pick-up"}</div>
          ${o.pickup_time ? `<div class="sub">${escapeHtml(formatTime(o.pickup_time))}</div>` : ""}
          ${o.fulfillment === "delivery" && o.delivery_address ? `<div class="sub">${escapeHtml(o.delivery_address)}</div>` : ""}
        </td>
        <td class="items">${formatItems(o)}</td>
        <td class="num">${money(o.total)}</td>
        <td class="paid">${o.paid ? "Paid" : "&nbsp;"}</td>
      </tr>`
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
    .num { width: 34px; text-align: center; }
    .name { font-weight: bold; }
    .type { font-weight: bold; }
    .sub { font-size: 10px; color: #475569; margin-top: 1px; }
    .items { line-height: 1.4; }
    .paid { width: 44px; text-align: center; font-size: 10px; font-weight: bold; }
    .paid { border-left: 2px solid #cbd5e1; }
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
  <table>
    <thead>
      <tr>
        <th class="num">#</th>
        <th>Name</th>
        <th>Pick-Up / Delivery</th>
        <th>What They Ordered</th>
        <th class="num">Total</th>
        <th class="paid">Paid</th>
      </tr>
    </thead>
    <tbody>${body}</tbody>
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