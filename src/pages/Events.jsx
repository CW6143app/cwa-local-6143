import React from "react";
import PageHeader from "@/components/mobile/PageHeader";
import EventCard from "@/components/mobile/EventCard";
import { EVENTS } from "@/lib/siteData";

export default function Events() {
  return (
    <div>
      <PageHeader
        eyebrow="Local 6143"
        title="Meetings & Events"
        subtitle="Monthly membership meetings are hybrid — join us in person or by Zoom." />
      
      <div className="space-y-4 px-6">
        {EVENTS.map((e, i) =>
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