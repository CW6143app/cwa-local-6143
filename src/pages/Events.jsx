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

  const events = synced.length ? synced : EVENTS;

  /**
   * Helper function to convert your event object into 
   * formatted date and time strings required by the button.
   */
  const formatEventForCalendar = (e) => {
    // Falls back to year 2026 or current year if e.year is undefined
    const year = e.year || new Date().getFullYear();
    
    // Construct ISO date string (YYYY-MM-DD)
    // Note: Ensure e.month and e.day are formatted appropriately (e.g. '05', '12')
    const startDate = e.dateIso || `${year}-${e.month.padStart(2, '0')}-${e.day.padStart(2, '0')}`;
    
    return {
      name: e.title || e.name || "CWA Local 6143 Meeting",
      description: e.description || e.subtitle || "Monthly membership meeting — join in person or via Zoom.",
      location: e.location || "Local 6143 Union Hall / Zoom",
      startDate: startDate,
      startTime: e.startTime || "18:00",
      endTime: e.endTime || "19:30",
      timeZone: "America/Chicago", // Adjust to your local timezone
    };
  };

return (
    <div>
      <PageHeader
        eyebrow="Local 6143"
        title="Meetings & Events"
        subtitle="Monthly membership meetings are hybrid — join us in person or by Zoom." 
      />
      
      <div className="space-y-4 px-6">
        {events.map((e, i) => {
          const calData = formatEventForCalendar(e);

          return (
            <div key={`${e.month}-${e.day}-${i}`} className="space-y-2">
              <EventCard event={e} index={i} />
              
              {/* Add to Calendar Button per Event */}
              <div className="flex justify-end">
                <AddToCalendarButton
                  name={calData.name}
                  description={calData.description}
                  location={calData.location}
                  startDate={calData.startDate}
                  startTime={calData.startTime}
                  endTime={calData.endTime}
                  timeZone={calData.timeZone}
                  options={['Google', 'Apple', 'Outlook.com', 'iCal']}
                  buttonStyle="round"
                  size="1"
                  lightMode="bodyScheme"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-6 pt-8 space-y-3">
        <a
          href="https://cwa6143.org/meetings-events"
          target="_blank"
          rel="noreferrer"
          className="block rounded-2xl py-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white bg-gray-950"
        >
          See full calendar
        </a>
      </div>
    </div>
  );
}
