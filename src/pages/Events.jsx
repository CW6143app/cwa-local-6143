import React, { useState, useEffect } from "react";
import PageHeader from "@/components/mobile/PageHeader";
import EventCard from "@/components/mobile/EventCard";
import { base44 } from "@/api/base44Client";
import { EVENTS } from "@/lib/siteData";

export default function Events() {
  const [synced, setSynced] = useState([]);

  useEffect(() => {
    base44.entities.SyncedEvent.list("sort_order", 20)
      .then((data) => setSynced(Array.isArray(data) ? data : []))
      .catch(() => setSynced([]));
  }, []);

  const events = synced.length ? synced : EVENTS;

  return (
    <div>
      <PageHeader
        eyebrow="Local 6143"
        title="Meetings & Events"
        subtitle="Monthly membership meetings are hybrid — join us in person or by Zoom." />
      
      <div className="space-y-4 px-6">
        {events.map((e, i) =>
        <EventCard key={`${e.month}-${e.day}`} event={e} index={i} />
        )}
      </div>
      <div className="px-6 pt-8">
        <a
          href="https://cwa6143.org/meetings-events"
          target="_blank"
          rel="noreferrer"
          className="block rounded-2xl py-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white bg-gray-950">
          
          See full calendar
        </a>
      </div>
    </div>);

}