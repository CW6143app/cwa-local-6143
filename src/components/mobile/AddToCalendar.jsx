import React, { useState, useRef, useEffect } from "react";
import { CalendarPlus, ChevronDown, Calendar } from "lucide-react";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function toIsoDate(dateStr) {
  // dateStr like "2026-09-10"
  return dateStr;
}

function buildGoogleUrl(e) {
  const start = `${e.startDate}T${e.startTime}:00`;
  const [sh, sm] = e.startTime.split(":").map(Number);
  const [eh, em] = e.endTime.split(":").map(Number);
  const end = `${e.startDate}T${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}:00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.name,
    dates: `${start.replace(/[-:]/g, "")}/${end.replace(/[-:]/g, "")}`,
    details: e.description,
    location: e.location,
    ctz: e.timeZone,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildIcs(e) {
  const start = `${e.startDate}T${e.startTime}:00`;
  const [eh, em] = e.endTime.split(":").map(Number);
  const end = `${e.startDate}T${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}:00`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CWA Local 6143//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@cwa6143`,
    `DTSTAMP:${start.replace(/[-:]/g, "")}Z`,
    `DTSTART:${start.replace(/[-:]/g, "")}`,
    `DTEND:${end.replace(/[-:]/g, "")}`,
    `SUMMARY:${e.name}`,
    `DESCRIPTION:${e.description}`,
    `LOCATION:${e.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export default function AddToCalendar({ event }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
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
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full bg-[#c8102e] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#a50d24] transition-colors"
      >
        <CalendarPlus className="h-3.5 w-3.5" />
        Add to Calendar
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg">
          <a
            href={buildGoogleUrl(event)}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-[#0b2545] hover:bg-black/5"
          >
            <Calendar className="h-4 w-4 text-[#c8102e]" /> Google
          </a>
          <button
            type="button"
            onClick={downloadIcs}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-[#0b2545] hover:bg-black/5"
          >
            <Calendar className="h-4 w-4 text-[#c8102e]" /> Apple / Outlook / iCal
          </button>
        </div>
      )}
    </div>
  );
}