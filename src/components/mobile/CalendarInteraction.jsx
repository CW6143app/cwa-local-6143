import React, { useState, useRef, useEffect } from "react";
import { CalendarPlus, ChevronDown, ChevronLeft, Copy, Check, Rss } from "lucide-react";
import { buildGoogleUrl, buildOutlookUrl, downloadIcs } from "@/lib/calendarUtils";

export default function CalendarInteraction({ event }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(null);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (ev) => {
      if (ref.current && !ref.current.contains(ev.target)) {
        setOpen(false);
        setMode(null);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const feedUrl = `${window.location.origin}/functions/calendarFeed`;

  const copyFeed = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
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
        <div className="absolute right-0 top-full z-30 mt-1 w-72 overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl">
          {mode === null && (
            <div className="p-1.5">
              <button
                onClick={() => setMode("single")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-black/5"
              >
                <CalendarPlus className="h-4 w-4 shrink-0 text-[#c8102e]" />
                <span>
                  <span className="block text-sm font-semibold text-[#0b2545]">Add Single Event</span>
                  <span className="block text-xs text-slate-500">Add this event to your calendar</span>
                </span>
              </button>
              <button
                onClick={() => setMode("subscribe")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-black/5"
              >
                <Rss className="h-4 w-4 shrink-0 text-[#c8102e]" />
                <span>
                  <span className="block text-sm font-semibold text-[#0b2545]">Subscribe to Calendar</span>
                  <span className="block text-xs text-slate-500">Stay synced with all Local 6143 events</span>
                </span>
              </button>
            </div>
          )}

          {mode === "single" && (
            <div className="p-2">
              <button
                onClick={() => setMode(null)}
                className="mb-1 flex items-center gap-1 px-1 py-1 text-xs font-medium text-slate-500 hover:text-[#0b2545]"
              >
                <ChevronLeft className="h-3 w-3" /> Back
              </button>
              <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Add this event
              </p>
              <div className="space-y-1.5">
                <a
                  href={buildGoogleUrl(event)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg bg-[#c8102e] px-3 py-2.5 text-center text-xs font-semibold text-white hover:bg-[#a50d24]"
                >
                  Google Calendar
                </a>
                <a
                  href={buildOutlookUrl(event)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg border border-[#0b2545] px-3 py-2.5 text-center text-xs font-semibold text-[#0b2545] hover:bg-black/5"
                >
                  Outlook
                </a>
                <button
                  onClick={() => {
                    downloadIcs(event);
                    setOpen(false);
                  }}
                  className="block w-full rounded-lg border border-black/10 px-3 py-2.5 text-center text-xs font-semibold text-[#0b2545] hover:bg-black/5"
                >
                  Apple / Local Device Calendar
                </button>
              </div>
            </div>
          )}

          {mode === "subscribe" && (
            <div className="p-2">
              <button
                onClick={() => setMode(null)}
                className="mb-1 flex items-center gap-1 px-1 py-1 text-xs font-medium text-slate-500 hover:text-[#0b2545]"
              >
                <ChevronLeft className="h-3 w-3" /> Back
              </button>
              <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Subscribe to feed
              </p>
              <p className="px-1 pb-2 text-xs leading-relaxed text-slate-500">
                Copy this URL and paste it into Apple Calendar (Settings → Accounts → Add Subscribed
                Calendar) or Google Calendar (Other calendars → From URL).
              </p>
              <div className="flex items-center gap-1.5 rounded-lg border border-black/10 bg-black/5 px-2 py-1.5">
                <input
                  readOnly
                  value={feedUrl}
                  onFocus={(ev) => ev.target.select()}
                  className="min-w-0 flex-1 bg-transparent text-xs text-[#0b2545] outline-none"
                />
                <button
                  onClick={copyFeed}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#c8102e] px-2 py-1.5 text-xs font-semibold text-white hover:bg-[#a50d24]"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}