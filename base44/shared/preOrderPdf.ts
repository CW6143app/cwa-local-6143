import { jsPDF } from "npm:jspdf@4.2.1";

const NAVY = [11, 37, 69];
const RED = [200, 16, 46];
const MUTED = [113, 113, 122];
const LINE = [228, 228, 231];
const CARD = [246, 245, 242];
const WARM = [255, 245, 235];

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

const prettyTime = (time: any) => {
  if (!time) return "—";
  const [h, m] = String(time).split(":").map(Number);
  if (Number.isNaN(h)) return String(time);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(Number.isNaN(m) ? 0 : m).padStart(2, "0")} ${suffix}`;
};

function stamp(order) {
  const raw = order?.created_date;
  const date = raw ? new Date(raw) : new Date();
  if (Number.isNaN(date.getTime())) return "—";
  const text = date.toLocaleString("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "medium",
    timeStyle: "short",
  });
  return `${text} CT`;
}

function orderCode(order) {
  const id = String(order?.id || "").replace(/[^A-Za-z0-9]/g, "");
  return id ? id.slice(-6).toUpperCase() : "—";
}

export function preOrderFileName(order) {
  const name = String(order?.buyer_name || "order").replace(/[^A-Za-z0-9]+/g, "_");
  return `PreOrder_${orderCode(order)}_${name}.pdf`;
}

export function toBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function buildPreOrderPdf(order = {}, sale = {}) {
  const isDelivery = order?.fulfillment === "delivery";
  const timeLabel = isDelivery ? "Delivery time" : "Pick-up time";
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 46;
  const contentW = pageW - margin * 2;
  const bottom = pageH - 72;
  let y = 0;

  const ensure = (height) => {
    if (y + height > bottom) {
      doc.addPage();
      y = 64;
    }
  };

  const label = (text, x) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(String(text).toUpperCase(), x, y);
  };

  const value = (text, x, width) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    const lines = doc.splitTextToSize(String(text || "—"), width);
    doc.text(lines, x, y + 13);
    return lines.length;
  };

  // Header band
  doc.setFillColor(RED[0], RED[1], RED[2]);
  doc.rect(0, 0, pageW, 94, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CWA Local 6143", margin, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text(isDelivery ? "Pre-Order Delivery Ticket" : "Pre-Order Pick-Up Ticket", margin, 64);
  doc.setFontSize(8.5);
  doc.text(stamp(order), pageW - margin, 44, { align: "right" });
  doc.text(
    `Order ${orderCode(order)} · ${String(order.status || "submitted").replace("_", " ").toUpperCase()}`,
    pageW - margin,
    64,
    { align: "right" }
  );
  y = 126;

  // Buyer + sale
  doc.setFillColor(CARD[0], CARD[1], CARD[2]);
  doc.roundedRect(margin, y - 16, contentW, 112, 8, 8, "F");
  const half = contentW / 2;
  const colW = half - 40;
  label("Name", margin + 16);
  value(order.buyer_name, margin + 16, colW);
  label("Email", margin + half);
  value(order.email, margin + half, colW);
  y += 34;
  label("Phone", margin + 16);
  value(order.phone, margin + 16, colW);
  label("Sale", margin + half);
  value(order.sale_title || sale.title, margin + half, colW);
  y += 34;
  label(timeLabel, margin + 16);
  value(prettyTime(order.pickup_time), margin + 16, colW);
  label("Order total", margin + half);
  value(money(order.total), margin + half, colW);
  y += 56;

  // Items table
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.rect(margin, y - 14, contentW, 22, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("ITEM", margin + 8, y + 1);
  doc.text("SIZE", margin + 250, y + 1);
  doc.text("QTY", pageW - margin - 168, y + 1, { align: "right" });
  doc.text("PRICE", pageW - margin - 96, y + 1, { align: "right" });
  doc.text("AMOUNT", pageW - margin - 8, y + 1, { align: "right" });
  y += 30;

  const items = Array.isArray(order.items) ? order.items : [];
  if (items.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text("No items on this order.", margin + 8, y);
    y += 20;
  }

  items.forEach((item) => {
    const nameLines = doc.splitTextToSize(String(item.name || "—"), 220);
    ensure(nameLines.length * 13 + 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text(nameLines, margin + 8, y);
    doc.text(String(item.size || "—"), margin + 250, y);
    doc.text(String(item.quantity == null ? "" : item.quantity), pageW - margin - 168, y, { align: "right" });
    doc.text(money(item.unit_price), pageW - margin - 96, y, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(money(item.line_total), pageW - margin - 8, y, { align: "right" });
    y += nameLines.length * 13 + 8;
    doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
    doc.line(margin, y - 12, pageW - margin, y - 12);
  });

  ensure(46);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.text("TOTAL", pageW - margin - 168, y, { align: "right" });
  doc.setFontSize(14);
  doc.setTextColor(RED[0], RED[1], RED[2]);
  doc.text(money(order.total), pageW - margin - 8, y, { align: "right" });
  y += 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text(order.paid ? "PAID" : isDelivery ? "PAYMENT DUE AT DELIVERY" : "PAYMENT DUE AT PICK-UP", pageW - margin - 8, y, {
    align: "right",
  });
  y += 30;

  const block = (title, body, tint) => {
    if (!body) return;
    const lines = doc.splitTextToSize(String(body), contentW - 32);
    const height = lines.length * 13 + 32;
    ensure(height);
    doc.setFillColor(tint[0], tint[1], tint[2]);
    doc.roundedRect(margin, y - 12, contentW, height, 8, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(String(title).toUpperCase(), margin + 16, y + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text(lines, margin + 16, y + 21);
    y += height + 12;
  };

  if (isDelivery) {
    block("Deliver to", order.delivery_address, WARM);
    block("Where to leave the food", order.delivery_instructions, CARD);
  }
  block("Pick-up / Payment", sale.pickup_info, CARD);
  if (sale.zelle_info) {
    const code = orderCode(order);
    block(
      "Zelle",
      `${sale.zelle_info} — amount ${money(order.total)}${code !== "—" ? `, memo ${code}` : ""}`,
      WARM
    );
  }
  block("Notes from buyer", order.notes, CARD);

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text("Submitted through the CWA Local 6143 mobile app", margin, pageH - 30);
    doc.text(`Page ${i} of ${total}`, pageW - margin, pageH - 30, { align: "right" });
  }

  doc.setPage(1);
  doc.setProperties({ title: `Pre-Order ${orderCode(order)}` });
  return doc;
}

export function preOrderPdfBytes(order, sale) {
  return new Uint8Array(buildPreOrderPdf(order, sale).output("arraybuffer"));
}