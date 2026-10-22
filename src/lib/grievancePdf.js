import { jsPDF } from "jspdf";

const NAVY = [11, 37, 69];
const RED = [200, 16, 46];
const MUTED = [113, 113, 122];
const LINE = [228, 228, 231];
const RED_TINT = [255, 214, 220];

const BODY_SIZE = 10.5;
const LABEL_SIZE = 7.5;
const LINE_H = 14;

function cleanValue(value) {
  if (value === null || value === undefined) return "—";
  const text = String(value).trim();
  return text.length ? text : "—";
}

function grievanceNumber(g) {
  const year = g.year ? String(g.year).replace(/,/g, "") : "";
  const num = g.grievance_number === 0 || g.grievance_number ? String(g.grievance_number) : "";
  if (num) return year ? `${year}-${num}` : num;
  return g.local_grievance_num ? String(g.local_grievance_num) : "—";
}

function recordsPermission(g) {
  const granted = [];
  if (g.auth_personal_records) granted.push("Personal Records");
  if (g.auth_medical_records) granted.push("Medical Records");
  return granted.length ? granted.join(", ") : "None granted";
}

function submittedStamp(g) {
  const raw = g.created_date || g.submitted_at;
  const date = raw ? new Date(raw) : new Date();
  if (Number.isNaN(date.getTime())) return "—";
  const text = date.toLocaleString("en-US", {
    timeZone: "America/Chicago",
    dateStyle: "medium",
    timeStyle: "short",
  });
  return `${text} CT`;
}

// Single source of truth for what the document (PDF + email) shows.
function grievanceSections(g) {
  const incidentType = Array.isArray(g.incident_type) ? g.incident_type.join(", ") : g.incident_type;
  const address = [g.home_address, g.city, g.zip].filter(Boolean).join(", ");
  return [
    {
      title: "Grievant Information",
      fields: [
        ["Name of Grievant", g.name_of_grievant || g.name],
        ["Job Title", g.job_title],
        ["Grievance Number", grievanceNumber(g)],
        ["VP Group", g.vp_group ? `VP ${g.vp_group}` : ""],
        ["NCS", g.ncs],
        ["Home Address", address],
        ["Cell #", g.cell],
        ["Email", g.email],
        ["Gender", g.gender],
        ["Department", g.department],
        ["SUITS ID", g.suits_id],
        ["Work Location", g.work_location],
        ["1st Level Mgr.", g.first_level_mgr]
      ]
    },
    {
      title: "Incident",
      fields: [
        ["Date of Incident", g.date_of_incident],
        ["Incident Type", incidentType],
        ["Explain (Other)", g.explain_other],
        ["Explain your grievance", g.explain_grievance || g.reason_for_grievance],
        ["Settlement expected", g.settlement_expected],
        ["Violation of Article(s) or Past Practice", g.violation_of_articles]
      ]
    },
    {
      title: "Authorization",
      fields: [["Records permission granted for", recordsPermission(g)]]
    },
    {
      title: "Signature",
      fields: [
        ["Signature date", g.signature_date],
        ["Submitted", submittedStamp(g)]
      ]
    }
  ];
}

function drawHeader(doc, ctx, g) {
  const pageW = ctx.pageW;
  const margin = ctx.margin;
  doc.setFillColor(RED[0], RED[1], RED[2]);
  doc.rect(0, 0, pageW, 96, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CWA Local 6143", margin, 46);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(RED_TINT[0], RED_TINT[1], RED_TINT[2]);
  doc.text("GRIEVANCE FORM", margin, 64);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(grievanceNumber(g), pageW - margin, 46, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(RED_TINT[0], RED_TINT[1], RED_TINT[2]);
  doc.text("LOCAL 6143", pageW - margin, 64, { align: "right" });

  doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
  doc.setLineWidth(0.6);
  ctx.y = 128;
}

// Slim band for pages after the first so the document stays compact.
function drawContinuationHeader(doc, ctx, g) {
  const pageW = ctx.pageW;
  const margin = ctx.margin;
  doc.setFillColor(RED[0], RED[1], RED[2]);
  doc.rect(0, 0, pageW, 46, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("CWA Local 6143 — Grievance Form", margin, 29);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(grievanceNumber(g), pageW - margin, 29, { align: "right" });

  doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
  doc.setLineWidth(0.6);
  ctx.y = 74;
}

function drawSectionTitle(doc, ctx, title) {
  ctx.ensure(46);
  ctx.y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(RED[0], RED[1], RED[2]);
  doc.text(String(title).toUpperCase(), ctx.margin, ctx.y);

  ctx.y += 6;
  doc.setDrawColor(RED[0], RED[1], RED[2]);
  doc.setLineWidth(1.2);
  doc.line(ctx.margin, ctx.y, ctx.margin + ctx.contentW, ctx.y);
  doc.setLineWidth(0.6);
  doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
  ctx.y += 15;
}

function drawField(doc, ctx, label, value) {
  const contentW = ctx.contentW;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(BODY_SIZE);
  const lines = doc.splitTextToSize(cleanValue(value), contentW);

  // Label plus at least one value line must fit before the block starts.
  ctx.ensure(46);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(LABEL_SIZE);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text(String(label).toUpperCase(), ctx.margin, ctx.y);
  ctx.y += 12;

  // Draw the value one line at a time so a long answer flows onto the next
  // page instead of running off the bottom or being clipped.
  doc.setFont("helvetica", "normal");
  doc.setFontSize(BODY_SIZE);
  doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.setLineHeightFactor(1.33);
  lines.forEach((line) => {
    ctx.ensure(LINE_H + 6);
    doc.text(line, ctx.margin, ctx.y);
    ctx.y += LINE_H;
  });

  doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
  doc.line(ctx.margin, ctx.y, ctx.margin + contentW, ctx.y);
  ctx.y += 13;
}

function drawSignatureImage(doc, ctx, signatureDataUrl) {
  if (!signatureDataUrl) return false;
  try {
    const props = doc.getImageProperties(signatureDataUrl);
    let width = Math.min(ctx.contentW * 0.5, 200);
    let height = Math.max(1, (props.height / props.width) * width);
    // Keep a very tall capture from dominating the page.
    if (height > 80) {
      height = 80;
      width = Math.max(1, (props.width / props.height) * height);
    }
    ctx.ensure(height + 24);
    const format = (props.fileType || "PNG").toUpperCase();
    doc.addImage(signatureDataUrl, format, ctx.margin, ctx.y, width, height);
    ctx.y += height + 12;
    return true;
  } catch (err) {
    return false;
  }
}

function buildGrievancePdf(grievance, signatureDataUrl) {
  const g = grievance || {};
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 46;

  const ctx = {
    doc,
    pageW,
    pageH,
    margin,
    contentW: pageW - margin * 2,
    y: 0,
    bottom: pageH - 58
  };
  ctx.ensure = (height) => {
    if (ctx.y + height > ctx.bottom) {
      doc.addPage();
      drawContinuationHeader(doc, ctx, g);
    }
  };

  drawHeader(doc, ctx, g);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  const intro = doc.splitTextToSize(
    "Official record of the grievance filed with CWA Local 6143. This copy is provided to the grievant and to the Local.",
    ctx.contentW
  );
  doc.setLineHeightFactor(1.33);
  doc.text(intro, margin, ctx.y);
  ctx.y += intro.length * LINE_H + 6;

  grievanceSections(g).forEach((section) => {
    drawSectionTitle(doc, ctx, section.title);
    if (section.title === "Signature") {
      const drawn = drawSignatureImage(doc, ctx, signatureDataUrl);
      if (!drawn) {
        ctx.ensure(24);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(BODY_SIZE);
        doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        doc.text("No signature provided", margin, ctx.y);
        ctx.y += 18;
        doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
        doc.line(margin, ctx.y, margin + ctx.contentW, ctx.y);
        ctx.y += 12;
      }
      doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
      doc.line(margin, ctx.y, margin + ctx.contentW, ctx.y);
      ctx.y += 13;
    }
    section.fields.forEach(([label, value]) => drawField(doc, ctx, label, value));
  });

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text("Submitted through the CWA Local 6143 mobile app", margin, pageH - 26);
    doc.text(`Page ${i} of ${total}`, pageW - margin, pageH - 26, { align: "right" });
  }

  doc.setPage(1);
  doc.setProperties({ title: `Grievance ${grievanceNumber(g)}` });
  return doc;
}

function pdfFileName(g) {
  const raw = grievanceNumber(g) === "—" ? "grievance" : grievanceNumber(g);
  return `Grievance_${String(raw).replace(/[^A-Za-z0-9._-]/g, "")}.pdf`;
}

function downloadGrievancePdf(g, signatureDataUrl) {
  buildGrievancePdf(g, signatureDataUrl).save(pdfFileName(g));
}

function grievancePdfBase64(g, signatureDataUrl) {
  const dataUri = buildGrievancePdf(g, signatureDataUrl).output("datauristring");
  return dataUri.split(",")[1] || "";
}

// Signature images live in public storage; read them back as a data URL so they
// can be embedded in the PDF file itself.
async function fetchSignatureDataUrl(url) {
  if (!url || !/^https?:\/\//i.test(String(url))) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    return null;
  }
}

export {
  grievanceSections,
  grievanceNumber,
  recordsPermission,
  submittedStamp,
  buildGrievancePdf,
  downloadGrievancePdf,
  grievancePdfBase64,
  fetchSignatureDataUrl
};