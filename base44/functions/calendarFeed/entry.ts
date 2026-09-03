import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

function parseMonth(m: any): number | null {
  if (!m) return null;
  const num = parseInt(String(m), 10);
  if (!isNaN(num) && num >= 1 && num <= 12) return num;
  return MONTHS[String(m).slice(0, 3).toLowerCase()] ?? null;
}

function parseTimeDisplay(timeStr: any): { start: string; end: string } {
  if (!timeStr) return { start: "18:00", end: "19:30" };
  const parts = String(timeStr).split(/\s[–-]\s| to /i).map((s) => s.trim()).filter(Boolean);
  const parseOne = (t: string): string | null => {
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

function escapeIcs(text: any): string {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function fmtDateTime(dateStr: string, timeStr: string): string {
  return `${dateStr.replace(/-/g, "")}T${timeStr.replace(/:/g, "")}00`;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const events: any[] = await base44.asServiceRole.entities.SyncedEvent.list("sort_order", 200);
    const now = new Date();
    const dtstamp = fmtDateTime(now.toISOString().slice(0, 10), "00:00");
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//CWA Local 6143//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:CWA Local 6143 Events",
      "X-WR-TIMEZONE:America/Chicago",
    ];
    for (const e of events) {
      const year = e.year || now.getFullYear();
      const monthNum = parseMonth(e.month) || 1;
      const day = parseInt(e.day, 10) || 1;
      const startDate = `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const { start, end } = parseTimeDisplay(e.time);
      lines.push(
        "BEGIN:VEVENT",
        `UID:${e.id || Date.now()}@cwa6143`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${fmtDateTime(startDate, start)}`,
        `DTEND:${fmtDateTime(startDate, end)}`,
        `SUMMARY:${escapeIcs(e.title || "CWA Local 6143 Event")}`,
        `DESCRIPTION:${escapeIcs(e.note || "")}`,
        `LOCATION:${escapeIcs(e.location || "")}`,
      );
      if (e.url) lines.push(`URL:${escapeIcs(e.url)}`);
      lines.push("END:VEVENT");
    }
    lines.push("END:VCALENDAR");
    const ics = lines.join("\r\n");
    return new Response(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="cwa6143-events.ics"',
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}