import { secrets } from "base44:runtime";
import { escapeHtml, sendEmail, isValidEmail, nowCentral } from "../../shared/email.ts";

const COMMITTEE_EMAIL = "cwaelectioncommittee@gmail.com";

export default async function (req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({} as any));
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const address = String(body.address || "").trim();

    if (!name || !email) {
      return Response.json({ error: "Name and email are required." }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return Response.json({ error: "A valid email is required." }, { status: 400 });
    }

    const apiKey = secrets.get("RESEND_API_KEY");
    if (!apiKey) return Response.json({ error: "Email service not configured." }, { status: 500 });

    const subject = "Local Election 2026 — Ballot Not Received";
    const submittedAt = nowCentral();

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr>
          <td style="background-color:#c8102e;padding:20px 32px;">
            <p style="margin:0;color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:0.5px;">CWA Local 6143</p>
            <p style="margin:2px 0 0;color:#ffd1d8;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Local Election 2026</p>
          </td>
        </tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;color:#0b2545;font-weight:bold;">A member has reported they have NOT received their election ballot.</p>
          <p style="margin:0 0 24px;font-size:14px;color:#52525b;line-height:1.6;">Please reach out to the member below to ensure they receive their ballot for the Local Election 2026.</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr><td style="padding:12px 0;border-bottom:1px solid #f1f1f1;width:120px;vertical-align:top;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Name</td><td style="padding:12px 0;border-bottom:1px solid #f1f1f1;color:#0b2545;font-size:14px;font-weight:bold;">${escapeHtml(name)}</td></tr>
            <tr><td style="padding:12px 0;border-bottom:1px solid #f1f1f1;vertical-align:top;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Email</td><td style="padding:12px 0;border-bottom:1px solid #f1f1f1;color:#0b2545;font-size:14px;">${escapeHtml(email)}</td></tr>
            <tr><td style="padding:12px 0;border-bottom:1px solid #f1f1f1;vertical-align:top;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Phone</td><td style="padding:12px 0;border-bottom:1px solid #f1f1f1;color:#0b2545;font-size:14px;">${escapeHtml(phone || "—")}</td></tr>
            <tr><td style="padding:12px 0;border-bottom:1px solid #f1f1f1;vertical-align:top;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Address</td><td style="padding:12px 0;border-bottom:1px solid #f1f1f1;color:#0b2545;font-size:14px;">${escapeHtml(address || "—")}</td></tr>
            <tr><td style="padding:12px 0;vertical-align:top;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Submitted</td><td style="padding:12px 0;color:#0b2545;font-size:14px;">${escapeHtml(submittedAt)} (CT)</td></tr>
          </table>
        </tr>
        <tr><td style="background-color:#0b2545;padding:16px 32px;">
          <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center;">This message was sent automatically from the CWA Local 6143 mobile app.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const text = `CWA Local 6143 — Local Election 2026

A member has reported they have NOT received their election ballot.

Name: ${name}
Email: ${email}
Phone: ${phone || "—"}
Address: ${address || "—"}
Submitted: ${submittedAt} (CT)

This message was sent automatically from the CWA Local 6143 mobile app.`;

    const voterHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr><td style="background-color:#0b2545;padding:20px 32px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:bold;">CWA Local 6143</p>
          <p style="margin:2px 0 0;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Election Committee</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;color:#0b2545;">Hello <strong>${escapeHtml(name)}</strong>,</p>
          <p style="margin:0 0 16px;font-size:14px;color:#52525b;line-height:1.6;">Thank you for updating your information with the CWA Election Committee. We have received your updated details and will use them to ensure your records are up to date regarding your election ballot.</p>
          <p style="margin:0;font-size:14px;color:#52525b;line-height:1.6;">Best regards,<br><strong>CWA Election Committee</strong></p>
        </td></tr>
        <tr><td style="background-color:#f1f1f1;padding:16px 32px;">
          <p style="margin:0;color:#71717a;font-size:11px;text-align:center;">This confirmation was sent automatically from the CWA Local 6143 mobile app.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const voterText = `Hello ${name},\n\nThank you for updating your information with the CWA Election Committee. We have received your updated details and will use them to ensure your records are up to date regarding your election ballot.\n\nBest regards,\nCWA Election Committee`;

    const [committeeRes, voterRes] = await Promise.all([
      sendEmail(apiKey, { to: COMMITTEE_EMAIL, reply_to: email, subject, html, text }),
      sendEmail(apiKey, { to: email, subject: "Confirmation: Your contact information update has been received", html: voterHtml, text: voterText }),
    ]);

    if (!committeeRes.ok) {
      return Response.json({ error: committeeRes.data?.error?.message || "Email delivery failed." }, { status: 502 });
    }

    return Response.json({ ok: true, id: committeeRes.data.id, voterNotified: voterRes.ok });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}