const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

export function parseMonth(m) {
  if (!m) return null;
  const num = parseInt(String(m), 10);
  if (!isNaN(num) && num >= 1 && num <= 12) return num;
  return MONTHS[String(m).slice(0, 3).toLowerCase()];
}

export function parseTimeDisplay(timeStr) {
  if (!timeStr) return { start: "18:00", end: "19:30" };
  const parts = String(timeStr).split(/\s[–-]\s| to /i).map((s) => s.trim()).filter(Boolean);
  const parseOne = (t) => {
    const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!m) return null;
    let h = parseInt(m[1], 10);
    const min = m[2];
    const ap = m[3].toUpperCase();
    if (ap === "PM" && h !== 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${min}`;
  };
  const start = parseOne(parts[0]) || "18:00";
  const end = (parts[1] && parseOne(parts[1])) || "19:30";
  return { start, end };
}

export function resolveEventDateTime(e) {
  const now = new Date();
  const year = e.year || now.getFullYear();
  const monthNum = parseMonth(e.month) || 1;
  const day = parseInt(e.day, 10) || 1;
  const startDate = e.dateIso || `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const { start, end } = parseTimeDisplay(e.time);
  return { startDate, startTime: start, endTime: end };
}

function fmtDateTime(dateStr, timeStr) {
  return `${dateStr.replace(/-/g, "")}T${timeStr.replace(/:/g, "")}00`;
}

function escapeIcs(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function buildGoogleUrl(e) {
  const { startDate, startTime, endTime } = resolveEventDateTime(e);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title || e.name || "CWA Local 6143 Event",
    dates: `${fmtDateTime(startDate, startTime)}/${fmtDateTime(startDate, endTime)}`,
    details: e.note || e.description || "",
    location: e.location || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildOutlookUrl(e) {
  const { startDate, startTime, endTime } = resolveEventDateTime(e);
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    startdt: `${startDate}T${startTime}:00`,
    enddt: `${startDate}T${endTime}:00`,
    subject: e.title || e.name || "CWA Local 6143 Event",
    body: e.note || e.description || "",
    location: e.location || "",
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function buildIcsForEvent(e, uid) {
  const { startDate, startTime, endTime } = resolveEventDateTime(e);
  const dtstamp = fmtDateTime(new Date().toISOString().slice(0, 10), "00:00");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CWA Local 6143//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid || Date.now()}@cwa6143`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${fmtDateTime(startDate, startTime)}`,
    `DTEND:${fmtDateTime(startDate, endTime)}`,
    `SUMMARY:${escapeIcs(e.title || e.name || "CWA Local 6143 Event")}`,
    `DESCRIPTION:${escapeIcs(e.note || e.description || "")}`,
    `LOCATION:${escapeIcs(e.location || "")}`,
  ];
  if (e.url) lines.push(`URL:${escapeIcs(e.url)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(e) {
  const ics = buildIcsForEvent(e, `${Date.now()}`);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cwa6143-event.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}