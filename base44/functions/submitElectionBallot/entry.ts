import { secrets } from "base44:runtime";

// Sandbox sender (onboarding@resend.dev) can only deliver to the Resend account owner.
// Until a sending domain is verified, route submissions to the account owner.
const COMMITTEE_EMAIL = "appcwa6143@gmail.com";

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "A valid email is required." }, { status: 400 });
    }

    const apiKey = secrets.get("RESEND_API_KEY");
    if (!apiKey) return Response.json({ error: "Email service not configured." }, { status: 500 });

    const subject = "Local Election 2026 — Ballot Not Received";
    const submittedAt = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });

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

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CWA Local 6143 App <onboarding@resend.dev>",
        to: COMMITTEE_EMAIL,
        reply_to: email,
        subject,
        html,
        text,
      }),
    });

    const data: any = await res.json().catch(() => ({} as any));
    if (!res.ok) {
      return Response.json({ error: data.error?.message || "Email delivery failed." }, { status: 502 });
    }

    return Response.json({ ok: true, id: data.id });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}