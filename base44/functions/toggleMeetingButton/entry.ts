import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const ZOOM_URL = "https://us02web.zoom.us/j/86358644306?pwd=VVRinTQCDLhCTM4SS3oXbXR93lgCva.1";

// Returns true only on the second Thursday of the month, in US Central Time.
function isSecondThursdayInChicago() {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    day: "2-digit",
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  const weekday = parts.weekday;
  const day = parseInt(parts.day, 10);
  return weekday === "Thu" && day >= 8 && day <= 14;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try { body = await req.json(); } catch {}
    const action = body.action === "off" ? "off" : "on";

    // `force` lets an admin test the toggle outside the scheduled day.
    if (!body.force && !isSecondThursdayInChicago()) {
      return Response.json({ skipped: true, reason: "Not the second Thursday of the month." });
    }

    const value = action === "on" ? ZOOM_URL : "";
    const events = await base44.asServiceRole.entities.SyncedEvent.list("sort_order", 100);
    const list = Array.isArray(events) ? events : [];
    const matches = list.filter((e) => (e.title || "").includes("Membership Meeting"));
    if (matches.length === 0) {
      return Response.json({ skipped: true, reason: "No membership meeting event found." });
    }
    const updates = matches.map((e) => ({ id: e.id, join_meeting_url: value }));
    await base44.asServiceRole.entities.SyncedEvent.bulkUpdate(updates);
    return Response.json({ action, updated: matches.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}