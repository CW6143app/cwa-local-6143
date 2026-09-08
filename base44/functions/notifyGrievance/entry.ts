import { secrets } from "base44:runtime";
import { escapeHtml, sendEmail, isValidEmail, nowCentral } from "../../shared/email.ts";

const NOTIFY_EMAIL = "mail@cwa6143.org";

function row(label, value) {
  return `<tr><td style="padding:12px 0;border-bottom:1px solid #f1f1f1;width:160px;vertical-align:top;color:#71717a;font-size:12px;text-transform:uppercase;letter-spacing:1px;">${escapeHtml(label)}</td><td style="padding:12px 0;border-bottom:1px solid #f1f1f1;color:#0b2545;font-size:14px;">${escapeHtml(value || "—")}</td></tr>`;
}

export default async function (req: Request): Promise<Response> {
  try {
    const b = await req.json().catch(() => ({} as any));
    const name = String(b.name || b.name_of_grievant || "").trim();
    const email = String(b.email || "").trim();

    if (!name || !email) return Response.json({ error: "Name and email are required." }, { status: 400 });
    if (!isValidEmail(email)) return Response.json({ error: "A valid email is required." }, { status: 400 });

    const apiKey = secrets.get("RESEND_API_KEY");
    if (!apiKey) return Response.json({ error: "Email service not configured." }, { status: 500 });

    const submittedAt = nowCentral();
    const subject = `Grievance Filed: ${name}`;

    const incidentType = Array.isArray(b.incident_type) ? b.incident_type.join(", ") : String(b.incident_type || "");
    const auth = [
      b.auth_personal_records ? "Personal Records" : null,
      b.auth_medical_records ? "Medical Records" : null,
    ].filter(Boolean).join(", ") || "None granted";

    const fields = [
      ["Name of Grievant", name],
      ["Email", email],
      ["Cell #", b.cell],
      ["NCS", b.ncs],
      ["Home Address", [b.home_address, b.city, b.zip].filter(Boolean).join(", ")],
      ["Gender", b.gender],
      ["Job Title", b.job_title],
      ["Department", b.department],
      ["SUITS ID", b.suits_id],
      ["Work Location", b.work_location],
      ["1st Level Mgr.", b.first_level_mgr],
      ["Date of Incident", b.date_of_incident],
      ["Incident Type", incidentType],
      ["Explain (other)", b.explain_other],
      ["Explain your grievance", b.explain_grievance],
      ["Settlement expected", b.settlement_expected],
      ["Violation of Article(s)", b.violation_of_articles],
      ["Records permission", auth],
      ["Signature (Initials)", b.signature_initials],
      ["Signature Date", b.signature_date],
      ["Date of Submission", b.date_of_submission],
      ["Submitted", `${submittedAt} (CT)`],
    ];

    const notifyHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr><td style="background-color:#c8102e;padding:20px 32px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:bold;">CWA Local 6143</p>
          <p style="margin:2px 0 0;color:#ffd1d8;font-size:12px;text-transform:uppercase;letter-spacing:2px;">New Grievance Filed</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 20px;font-size:16px;color:#0b2545;font-weight:bold;">A member has submitted a new grievance.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            ${fields.map(([k, v]) => row(k, v)).join("\n            ")}
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

    const notifyText = `CWA Local 6143 — New Grievance Filed\n\n${fields.map(([k, v]) => `${k}: ${v || "—"}`).join("\n")}\n\nThis message was sent automatically from the CWA Local 6143 mobile app.`;

    const confirmHtml = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr><td style="background-color:#0b2545;padding:20px 32px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:bold;">CWA Local 6143</p>
          <p style="margin:2px 0 0;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Grievance Received</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:15px;color:#0b2545;">Hello <strong>${escapeHtml(name)}</strong>,</p>
          <p style="margin:0 0 16px;font-size:14px;color:#52525b;line-height:1.6;">Your grievance has been filed with CWA Local 6143. A steward will follow up with you regarding this matter. Please keep this confirmation for your records.</p>
          <p style="margin:0;font-size:14px;color:#52525b;line-height:1.6;">In solidarity,<br><strong>CWA Local 6143</strong></p>
        </td></tr>
        <tr><td style="background-color:#f1f1f1;padding:16px 32px;">
          <p style="margin:0;color:#71717a;font-size:11px;text-align:center;">This confirmation was sent automatically from the CWA Local 6143 mobile app.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const confirmText = `Hello ${name},\n\nYour grievance has been filed with CWA Local 6143. A steward will follow up with you regarding this matter. Please keep this confirmation for your records.\n\nIn solidarity,\nCWA Local 6143`;

    const [notifyRes, confirmRes] = await Promise.all([
      sendEmail(apiKey, { to: NOTIFY_EMAIL, reply_to: email, subject, html: notifyHtml, text: notifyText }),
      sendEmail(apiKey, { to: email, subject: "Confirmation: Your grievance has been filed", html: confirmHtml, text: confirmText }),
    ]);

    if (!notifyRes.ok) {
      return Response.json({ error: notifyRes.data?.error?.message || "Email delivery failed." }, { status: 502 });
    }

    return Response.json({ ok: true, id: notifyRes.data.id, userNotified: confirmRes.ok });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}