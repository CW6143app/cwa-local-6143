import React, { useState, useEffect } from "react";
import PageHeader from "@/components/mobile/PageHeader";
import EventCard from "@/components/mobile/EventCard";
import CalendarInteraction from "@/components/mobile/CalendarInteraction";
import PullToRefresh from "@/components/mobile/PullToRefresh";
import { base44 } from "@/api/base44Client";
import { EVENTS } from "@/lib/siteData";

export default function Events() {
  const [synced, setSynced] = useState([]);

  const loadEvents = () => {
    base44.entities.SyncedEvent.list("sort_order", 100)
      .then((data) => setSynced(Array.isArray(data) ? data : []))
      .catch(() => setSynced([]));
  };

  useEffect(() => {
    loadEvents();
    const unsubscribe = base44.entities.SyncedEvent.subscribe(() => loadEvents());
    return unsubscribe;
  }, []);

  const events = synced.length ? synced : EVENTS;

  return (
    <PullToRefresh onRefresh={loadEvents}>
    <div>
      <PageHeader
        eyebrow="Local 6143"
        title="Meetings & Events"
        subtitle="Monthly membership meetings are hybrid — join us in person or by Zoom."
      />

      <div className="space-y-4 px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          {events.length} upcoming {events.length === 1 ? "event" : "events"}
        </p>
        {events.map((e, i) => (
          <div key={`${e.month}-${e.day}-${i}`} className="space-y-2">
            <EventCard event={e} index={i} />
            {e.join_meeting_url && (
              <a
                href={e.join_meeting_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#c8102e] px-4 py-3 text-sm font-semibold text-white hover:bg-[#a50d24] transition-colors"
              >
                Join Meeting
              </a>
            )}
            <div className="flex justify-end">
              <CalendarInteraction event={e} />
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 pt-8 space-y-3">
        <a
          href="https://cwa6143.org/meetings-events"
          target="_blank"
          rel="noreferrer"
          className="block rounded-2xl py-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white bg-[#c8102e] hover:bg-[#c8102e]/90 transition-colors"
        >
          See full calendar
        </a>
      </div>
    </div>
    </PullToRefresh>
  );
}