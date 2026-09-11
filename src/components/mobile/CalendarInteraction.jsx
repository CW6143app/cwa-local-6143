import React, { useState, useRef, useEffect } from "react";
import { CalendarPlus, ChevronDown, Copy, Check, Rss } from "lucide-react";
import { addToNativeCalendar } from "@/lib/calendarUtils";

export default function CalendarInteraction({ event }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (ev) => {
      if (ref.current && !ref.current.contains(ev.target)) {
        setOpen(false);
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
    <div ref={ref} className="relative flex items-center gap-1">
      <button
        type="button"
        onClick={() => addToNativeCalendar(event)}
        className="inline-flex items-center gap-1.5 rounded-full bg-[#c8102e] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#a50d24] transition-colors"
      >
        <CalendarPlus className="h-3.5 w-3.5" />
        Add to Calendar
      </button>

      <button
        type="button"
        aria-label="More calendar options"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center justify-center rounded-full bg-[#c8102e]/10 p-1.5 text-[#c8102e] hover:bg-[#c8102e]/20 transition-colors"
      >
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-72 overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl">
          <div className="p-2">
            <p className="flex items-center gap-1.5 px-1 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              <Rss className="h-3 w-3" /> Subscribe to feed
            </p>
            <p className="px-1 pb-2 text-xs leading-relaxed text-slate-500">
              Copy this URL and paste it into Apple Calendar (Settings → Accounts → Add Subscribed
              Calendar) or Google Calendar (Other calendars → From URL) to stay synced with every
              Local 6143 event.
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
        </div>
      )}
    </div>
  );
}