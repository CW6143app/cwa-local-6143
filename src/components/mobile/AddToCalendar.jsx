import React, { useState, useRef, useEffect } from "react";
import { CalendarPlus, ChevronDown } from "lucide-react";

function fmtDateTime(dateStr, timeStr) {
  // returns YYYYMMDDTHHMMSS (local, no Z)
  return `${dateStr.replace(/-/g, "")}T${timeStr.replace(":", "")}00`;
}

function buildGoogleUrl(e) {
  const start = fmtDateTime(e.startDate, e.startTime);
  const end = fmtDateTime(e.startDate, e.endTime);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.name,
    dates: `${start}/${end}`,
    details: e.description,
    location: e.location,
    ctz: e.timeZone,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildOutlookUrl(e) {
  const start = `${e.startDate}T${e.startTime}:00`;
  const end = `${e.startDate}T${e.endTime}:00`;
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    startdt: start,
    enddt: end,
    subject: e.name,
    body: e.description,
    location: e.location,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function buildYahooUrl(e) {
  const start = fmtDateTime(e.startDate, e.startTime);
  const end = fmtDateTime(e.startDate, e.endTime);
  const params = new URLSearchParams({
    v: "60",
    view: "d",
    type: "20",
    title: e.name,
    st: start,
    et: end,
    desc: e.description,
    in_loc: e.location,
  });
  return `https://calendar.yahoo.com/?${params.toString()}`;
}

function buildIcs(e) {
  const start = fmtDateTime(e.startDate, e.startTime);
  const end = fmtDateTime(e.startDate, e.endTime);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CWA Local 6143//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@cwa6143`,
    `DTSTAMP:${start}Z`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${e.name}`,
    `DESCRIPTION:${e.description}`,
    `LOCATION:${e.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

const OPTIONS = [
  { key: "google", label: "Google Calendar", href: buildGoogleUrl, external: true },
  { key: "outlook", label: "Outlook", href: buildOutlookUrl, external: true },
  { key: "yahoo", label: "Yahoo Calendar", href: buildYahooUrl, external: true },
  { key: "ical", label: "Apple / iCal (.ics)", href: null, download: true },
];

export default function AddToCalendar({ event }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (ev) => {
      if (ref.current && !ref.current.contains(ev.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const downloadIcs = () => {
    const blob = new Blob([buildIcs(event)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cwa6143-event.ics";
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative inline-flex overflow-hidden rounded-full bg-[#c8102e]">
      <button
        type="button"
        onClick={downloadIcs}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#a50d24] transition-colors"
      >
        <CalendarPlus className="h-3.5 w-3.5" />
        Add to Calendar
      </button>
      <button
        type="button"
        aria-label="More calendar options"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center border-l border-white/20 px-2 py-1.5 text-white hover:bg-[#a50d24] transition-colors"
      >
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg">
          <button
            type="button"
            onClick={downloadIcs}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-[#0b2545] hover:bg-black/5"
          >
            <span className="h-2 w-2 rounded-full bg-[#c8102e]" />
            Device calendar (.ics)
          </button>
          {OPTIONS.filter((o) => !o.download).map((opt) => (
            <a
              key={opt.key}
              href={opt.href(event)}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-[#0b2545] hover:bg-black/5"
            >
              <span className="h-2 w-2 rounded-full bg-[#c8102e]" />
              {opt.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}