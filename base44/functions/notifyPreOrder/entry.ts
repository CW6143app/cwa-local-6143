import { secrets } from "base44:runtime";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { escapeHtml, sendEmail, nowCentral } from "../../shared/email.ts";
import { preOrderFileName, preOrderPdfBytes, toBase64 } from "../../shared/preOrderPdf.ts";

const NOTIFY_EMAIL = "mail@cwa6143.org";

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

function prettyTime(time: any) {
  if (!time) return "—";
  const [h, m] = String(time).split(":").map(Number);
  if (Number.isNaN(h)) return String(time);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(Number.isNaN(m) ? 0 : m).padStart(2, "0")} ${suffix}`;
}

function itemRows(items) {
  return (items || [])
    .map(
      (item) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f1f1;color:#0b2545;font-size:14px;">${escapeHtml(
          `${item.quantity}× ${item.name}${item.size ? ` (${item.size})` : ""}`
        )}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f1f1f1;color:#0b2545;font-size:14px;text-align:right;">${money(
          item.line_total
        )}</td>
      </tr>`
    )
    .join("");
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({} as any));
    const orderId = String(body.orderId || "").trim();
    if (!orderId) return Response.json({ error: "Order not specified." }, { status: 400 });

    const order = await base44.asServiceRole.entities.PreOrder
      .get(orderId)
      .catch((e: any) => (e.status === 404 ? null : Promise.reject(e)));
    if (!order) return Response.json({ error: "Order not found." }, { status: 404 });

    const sale = order.sale_id
      ? await base44.asServiceRole.entities.PreOrderSale.get(order.sale_id).catch(() => null)
      : null;

    const apiKey = secrets.get("RESEND_API_KEY");
    if (!apiKey) return Response.json({ error: "Email service not configured." }, { status: 500 });

    const buyerName = String(order.buyer_name || "Member");
    const saleTitle = order.sale_title || sale?.title || "Pre-Order";
    const items = Array.isArray(order.items) ? order.items : [];
    const submittedAt = nowCentral();
    const pdfBase64 = toBase64(preOrderPdfBytes(order, sale || {}));
    const attachments = [{ filename: preOrderFileName(order), content: pdfBase64 }];
    const notesBlock = order.notes
      ? `<p style="margin:16px 0 0;font-size:13px;color:#52525b;"><strong>Notes:</strong> ${escapeHtml(order.notes)}</p>`
      : "";
    const zelleBlock = sale?.zelle_info
      ? `<p style="margin:12px 0 0;font-size:13px;color:#52525b;"><strong>Zelle:</strong> ${escapeHtml(
          sale.zelle_info
        )}</p>`
      : "";

    const notifyHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background-color:#0b2545;padding:20px 32px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:bold;">CWA Local 6143</p>
          <p style="margin:2px 0 0;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:2px;">New Pre-Order</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 4px;font-size:18px;color:#0b2545;font-weight:bold;">${escapeHtml(buyerName)}</p>
          <p style="margin:0 0 20px;font-size:13px;color:#71717a;">${escapeHtml(saleTitle)}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            ${itemRows(items)}
            <tr>
              <td style="padding:14px 0;font-size:14px;color:#0b2545;font-weight:bold;">Total</td>
              <td style="padding:14px 0;font-size:16px;color:#c8102e;font-weight:bold;text-align:right;">${money(
                order.total
              )}</td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-size:13px;color:#52525b;"><strong>Pick-up time:</strong> ${escapeHtml(
            prettyTime(order.pickup_time)
          )}</p>
          <p style="margin:8px 0 0;font-size:13px;color:#52525b;"><strong>Contact:</strong> ${escapeHtml(
            [order.email, order.phone].filter(Boolean).join(" · ") || "—"
          )}</p>
          <p style="margin:8px 0 0;font-size:13px;color:#52525b;"><strong>Payment:</strong> ${
            order.paid ? "Paid" : "Due at pick-up"
          }</p>
          <p style="margin:8px 0 0;font-size:13px;color:#52525b;"><strong>Received:</strong> ${escapeHtml(
            `${submittedAt} (CT)`
          )}</p>
          ${zelleBlock}
          ${notesBlock}
          <p style="margin:24px 0 0;font-size:12px;color:#71717a;">The printable pick-up ticket is attached as a PDF.</p>
        </td></tr>
        <tr><td style="background-color:#f1f1f1;padding:16px 32px;">
          <p style="margin:0;color:#71717a;font-size:11px;text-align:center;">Sent automatically from the CWA Local 6143 mobile app.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const notifyText = `CWA Local 6143 — New Pre-Order\n\nSale: ${saleTitle}\nName: ${buyerName}\nPick-up time: ${prettyTime(
      order.pickup_time
    )}\nContact: ${
      [order.email, order.phone].filter(Boolean).join(" · ") || "—"
    }\n\n${items
      .map((i) => `${i.quantity}x ${i.name}${i.size ? ` (${i.size})` : ""} — ${money(i.line_total)}`)
      .join("\n")}\n\nTotal: ${money(order.total)}\nPayment: ${order.paid ? "Paid" : "Due at pick-up"}\nReceived: ${submittedAt} (CT)\n\nThe printable pick-up ticket is attached as a PDF.`;

    const confirmHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background-color:#c8102e;padding:20px 32px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:bold;">CWA Local 6143</p>
          <p style="margin:2px 0 0;color:#ffd1d8;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Pre-Order Confirmation</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;color:#0b2545;">Hello <strong>${escapeHtml(buyerName)}</strong>,</p>
          <p style="margin:0 0 20px;font-size:14px;color:#52525b;line-height:1.6;">Thank you for your pre-order for <strong>${escapeHtml(
            saleTitle
          )}</strong>. Your order is listed below${sale?.pickup_info ? ` — ${escapeHtml(sale.pickup_info)}` : ""}.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            ${itemRows(items)}
            <tr>
              <td style="padding:14px 0;font-size:14px;color:#0b2545;font-weight:bold;">Total</td>
              <td style="padding:14px 0;font-size:16px;color:#c8102e;font-weight:bold;text-align:right;">${money(
                order.total
              )}</td>
            </tr>
          </table>
          <p style="margin:18px 0 0;font-size:14px;color:#0b2545;"><strong>Pick-up time:</strong> ${escapeHtml(
            prettyTime(order.pickup_time)
          )}</p>
          ${zelleBlock}
          <p style="margin:20px 0 0;font-size:13px;color:#52525b;">Your printable pick-up ticket is attached as a PDF. Bring it with you, or show it on your phone.</p>
          <p style="margin:16px 0 0;font-size:14px;color:#52525b;line-height:1.6;">In Solidarity,<br><strong>CWA Local 6143</strong></p>
        </td></tr>
        <tr><td style="background-color:#f1f1f1;padding:16px 32px;">
          <p style="margin:0;color:#71717a;font-size:11px;text-align:center;">This confirmation was sent automatically from the CWA Local 6143 mobile app.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const confirmText = `Hello ${buyerName},\n\nThank you for your pre-order for ${saleTitle}. Your order: ${items
      .map((i) => `${i.quantity}x ${i.name}${i.size ? ` (${i.size})` : ""}`)
      .join(", ")}. Total: ${money(order.total)}.\nPick-up time: ${prettyTime(
      order.pickup_time
    )}.\n\nYour printable pick-up ticket is attached as a PDF.\n\nIn Solidarity,\nCWA Local 6143`;

    const [notifyRes, confirmRes] = await Promise.all([
      sendEmail(apiKey, {
        to: NOTIFY_EMAIL,
        reply_to: order.email || undefined,
        subject: `New Pre-Order: ${buyerName} — ${saleTitle}`,
        html: notifyHtml,
        text: notifyText,
        attachments,
      }),
      order.email
        ? sendEmail(apiKey, {
            to: order.email,
            subject: `Pre-Order Confirmation — ${saleTitle}`,
            html: confirmHtml,
            text: confirmText,
            attachments,
          })
        : Promise.resolve({ ok: false, data: {} as any }),
    ]);

    return Response.json({ ok: notifyRes.ok, buyerNotified: confirmRes.ok });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}