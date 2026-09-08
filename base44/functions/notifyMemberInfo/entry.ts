import { secrets } from "base44:runtime";
import { escapeHtml, sendEmail, isValidEmail, nowCentral } from "../../shared/email.ts";

const NOTIFY_EMAIL = "mail@cwa6143.org";

function row(label, value) {
  return `<tr><td style="padding:12px 0;border-bottom:1px solid #f1f1f1;width:140px;vertical-align:top;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:1px;">${escapeHtml(label)}</td><td style="padding:12px 0;border-bottom:1px solid #f1f1f1;color:#0b2545;font-size:14px;">${escapeHtml(value || "—")}</td></tr>`;
}

export default async function (req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({} as any));
    const first_name = String(body.first_name || "").trim();
    const last_name = String(body.last_name || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const address = String(body.address || "").trim();
    const uid = String(body.uid || "").trim();
    const employer = String(body.employer || "").trim();
    const name = `${first_name} ${last_name}`.trim();

    if (!name || !email) return Response.json({ error: "Name and email are required." }, { status: 400 });
    if (!isValidEmail(email)) return Response.json({ error: "A valid email is required." }, { status: 400 });

    const apiKey = secrets.get("RESEND_API_KEY");
    if (!apiKey) return Response.json({ error: "Email service not configured." }, { status: 500 });

    const submittedAt = nowCentral();
    const subject = `Updated Contact Info: ${name}`;

    const notifyHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr><td style="background-color:#0b2545;padding:20px 32px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:bold;">CWA Local 6143</p>
          <p style="margin:2px 0 0;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Member Contact Update</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 20px;font-size:16px;color:#0b2545;font-weight:bold;">A member has submitted an updated contact information form.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            ${row("Name", name)}
            ${row("Email", email)}
            ${row("Phone", phone)}
            ${row("Address", address)}
            ${row("UID", uid)}
            ${row("Employer", employer)}
            ${row("Submitted", `${submittedAt} (CT)`)}
          </table>
        </td></tr>
        <tr><td style="background-color:#0b2545;padding:16px 32px;">
          <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center;">This message was sent automatically from the CWA Local 6143 mobile app.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const notifyText = `CWA Local 6143 — Member Contact Update\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || "—"}\nAddress: ${address || "—"}\nUID: ${uid || "—"}\nEmployer: ${employer || "—"}\nSubmitted: ${submittedAt} (CT)\n\nThis message was sent automatically from the CWA Local 6143 mobile app.`;

    const confirmHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr><td style="background-color:#c8102e;padding:20px 32px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:bold;">CWA Local 6143</p>
          <p style="margin:2px 0 0;color:#ffd1d8;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Contact Information Update</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;color:#0b2545;">Hello <strong>${escapeHtml(name)}</strong>,</p>
          <p style="margin:0 0 16px;font-size:14px;color:#52525b;line-height:1.6;">Thank you for updating your contact information with CWA Local 6143. We have received your updated details and will use them to keep your membership records current.</p>
          <p style="margin:0;font-size:14px;color:#52525b;line-height:1.6;">Best regards,<br><strong>CWA Local 6143</strong></p>
        </td></tr>
        <tr><td style="background-color:#f1f1f1;padding:16px 32px;">
          <p style="margin:0;color:#71717a;font-size:11px;text-align:center;">This confirmation was sent automatically from the CWA Local 6143 mobile app.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const confirmText = `Hello ${name},\n\nThank you for updating your contact information with CWA Local 6143. We have received your updated details and will use them to keep your membership records current.\n\nBest regards,\nCWA Local 6143`;

    const [notifyRes, confirmRes] = await Promise.all([
      sendEmail(apiKey, { to: NOTIFY_EMAIL, reply_to: email, subject, html: notifyHtml, text: notifyText }),
      sendEmail(apiKey, { to: email, subject: "Confirmation: Your contact information update has been received", html: confirmHtml, text: confirmText }),
    ]);

    if (!notifyRes.ok) {
      return Response.json({ error: notifyRes.data?.error?.message || "Email delivery failed." }, { status: 502 });
    }

    return Response.json({ ok: true, id: notifyRes.data.id, userNotified: confirmRes.ok });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}