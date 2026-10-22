import { secrets } from "base44:runtime";
import { escapeHtml, sendEmail, isValidEmail } from "../../shared/email.ts";

const NOTIFY_EMAIL = "mail@cwa6143.org";
const MAX_PDF_BASE64 = 3500000;

function cleanValue(value) {
  const text = String(value ?? "").trim();
  return text.length ? text : "—";
}

function grievanceNumber(b) {
  const year = b.year ? String(b.year).replace(/,/g, "") : "";
  if (b.grievance_number) return year ? `${year}-${b.grievance_number}` : String(b.grievance_number);
  return b.local_grievance_num ? String(b.local_grievance_num) : "—";
}

function recordsPermission(b) {
  const granted = [];
  if (b.auth_personal_records) granted.push("Personal Records");
  if (b.auth_medical_records) granted.push("Medical Records");
  return granted.length ? granted.join(", ") : "None granted";
}

function submittedStamp(b) {
  const raw = b.created_date || b.submitted_at;
  const date = raw ? new Date(raw) : new Date();
  if (Number.isNaN(date.getTime())) return "—";
  const text = date.toLocaleString("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "medium",
    timeStyle: "short",
  });
  return `${text} CT`;
}

// Mirrors the client's grievance document (src/lib/grievancePdf.js) so the email
// reads exactly like the attached PDF.
function sections(b) {
  const incidentType = Array.isArray(b.incident_type) ? b.incident_type.join(", ") : b.incident_type;
  const address = [b.home_address, b.city, b.zip].filter(Boolean).join(", ");
  return [
    {
      title: "Grievant Information",
      fields: [
        ["Name of Grievant", b.name_of_grievant || b.name],
        ["Job Title", b.job_title],
        ["Grievance Number", grievanceNumber(b)],
        ["VP Group", b.vp_group ? `VP ${b.vp_group}` : ""],
        ["NCS", b.ncs],
        ["Home Address", address],
        ["Cell #", b.cell],
        ["Email", b.email],
        ["Gender", b.gender],
        ["Department", b.department],
        ["SUITS ID", b.suits_id],
        ["Work Location", b.work_location],
        ["1st Level Mgr.", b.first_level_mgr],
      ],
    },
    {
      title: "Incident",
      fields: [
        ["Date of Incident", b.date_of_incident],
        ["Incident Type", incidentType],
        ["Explain (Other)", b.explain_other],
        ["Explain your grievance", b.explain_grievance || b.reason_for_grievance],
        ["Settlement expected", b.settlement_expected],
        ["Violation of Article(s) or Past Practice", b.violation_of_articles],
      ],
    },
    {
      title: "Authorization",
      fields: [["Records permission granted for", recordsPermission(b)]],
    },
    {
      title: "Signature",
      fields: [
        ["Signature date", b.signature_date],
        ["Submitted", submittedStamp(b)],
      ],
    },
  ];
}

const LABEL_CELL = "padding:11px 14px 11px 0;border-bottom:1px solid #f1f1f1;width:170px;vertical-align:top;color:#71717a;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;word-break:break-word;overflow-wrap:anywhere;";
const VALUE_CELL = "padding:11px 0;border-bottom:1px solid #f1f1f1;color:#0b2545;font-size:14px;line-height:1.55;word-break:break-word;overflow-wrap:anywhere;white-space:pre-wrap;";

function row(label, value) {
  return `<tr>
                  <td style="${LABEL_CELL}">${escapeHtml(label)}</td>
                  <td style="${VALUE_CELL}">${escapeHtml(cleanValue(value))}</td>
                </tr>`;
}

function signatureCell(b) {
  const url = String(b.signature_initials || "").trim();
  if (/^https?:\/\//i.test(url)) {
    return `<tr><td style="padding:8px 0 14px;border-bottom:1px solid #f1f1f1;">
                    <img src="${escapeHtml(url)}" alt="Member signature" width="240" style="display:block;width:240px;max-width:100%;height:auto;border:1px solid #e4e4e7;border-radius:8px;background-color:#ffffff;padding:8px;" />
                  </td></tr>`;
  }
  return `<tr><td style="padding:11px 0;border-bottom:1px solid #f1f1f1;color:#71717a;font-size:14px;font-style:italic;">No signature provided</td></tr>`;
}

function documentHtml(b, intro, tag) {
  const blocks = sections(b)
    .map((section) => {
      const rows =
        section.title === "Signature"
          ? signatureCell(b) + section.fields.map(([label, value]) => row(label, value)).join("\n                ")
          : section.fields.map(([label, value]) => row(label, value)).join("\n                ");
      return `<tr><td style="padding:24px 0 0;">
                  <p style="margin:0 0 3px;color:#c8102e;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;">${escapeHtml(section.title)}</p>
                  <div style="height:2px;background-color:#c8102e;line-height:2px;font-size:0;">&nbsp;</div>
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;table-layout:fixed;">
                    ${rows}
                  </table>
                </td></tr>`;
    })
    .join("\n                ");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 12px;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="width:640px;max-width:100%;background-color:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr><td style="background-color:#c8102e;padding:20px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:middle;">
                <p style="margin:0;color:#ffffff;font-size:18px;font-weight:bold;">CWA Local 6143</p>
                <p style="margin:3px 0 0;color:#ffd6dc;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;">Grievance Form</p>
              </td>
              <td align="right" style="vertical-align:middle;">
                <p style="margin:0;color:#ffffff;font-size:15px;font-weight:bold;">${escapeHtml(grievanceNumber(b))}</p>
                <p style="margin:3px 0 0;color:#ffd6dc;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;">${escapeHtml(tag)}</p>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:26px 32px 32px;">
          <p style="margin:0 0 18px;color:#52525b;font-size:13px;line-height:1.6;">${intro}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                ${blocks}
          </table>
        </td></tr>
        <tr><td style="background-color:#0b2545;padding:16px 32px;">
          <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center;">A PDF copy of this grievance is attached. Sent automatically from the CWA Local 6143 mobile app.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function documentText(b, intro) {
  const lines = [intro, ""];
  sections(b).forEach((section) => {
    lines.push(section.title.toUpperCase());
    if (section.title === "Signature") {
      lines.push(`Signature: ${b.signature_initials ? "image on file — see the attached PDF" : "not provided"}`);
    }
    section.fields.forEach(([label, value]) => lines.push(`${label}: ${cleanValue(value)}`));
    lines.push("");
  });
  lines.push("A PDF copy of this grievance is attached.");
  return lines.join("\n");
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

    const attachments = [];
    const pdfBase64 = typeof b.pdf_base64 === "string" ? b.pdf_base64 : "";
    if (pdfBase64.startsWith("JVBER") && pdfBase64.length < MAX_PDF_BASE64) {
      attachments.push({
        filename: `Grievance_${grievanceNumber(b).replace(/[^A-Za-z0-9._-]/g, "")}.pdf`,
        content: pdfBase64,
      });
    }

    const gNumber = grievanceNumber(b);
    const subject = `Grievance Filed: ${name}`;

    const notifyHtml = documentHtml(
      b,
      `A member has submitted a new grievance. Below is the complete grievance record, numbered <strong>${escapeHtml(gNumber)}</strong>.`,
      "New Grievance Filed"
    );

    const confirmHtml = documentHtml(
      b,
      `Hello <strong>${escapeHtml(name)}</strong>, your grievance has been filed with CWA Local 6143 and a steward will follow up with you. Below is a copy of your grievance for your records.`,
      "Grievance Received"
    );

    const [notifyRes, confirmRes] = await Promise.all([
      sendEmail(apiKey, {
        to: NOTIFY_EMAIL,
        reply_to: email,
        subject,
        html: notifyHtml,
        text: documentText(b, `A member has submitted a new grievance (${gNumber}).`),
        attachments,
      }),
      sendEmail(apiKey, {
        to: email,
        subject: "Confirmation: Your grievance has been filed",
        html: confirmHtml,
        text: documentText(b, `Hello ${name}, your grievance has been filed with CWA Local 6143.`),
        attachments,
      }),
    ]);

    if (!notifyRes.ok) {
      return Response.json({ error: notifyRes.data?.error?.message || "Email delivery failed." }, { status: 502 });
    }

    return Response.json({ ok: true, id: notifyRes.data.id, userNotified: confirmRes.ok, attached: attachments.length > 0 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}