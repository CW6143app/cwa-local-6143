import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const HOME_URL = 'https://cwa6143.org/';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled runs (no authenticated user) and manual admin runs.
    // Block any non-admin who tries to invoke it directly.
    const user = await base44.auth.me();
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const res = await fetch(HOME_URL, {
      headers: { 'User-Agent': 'CWA6143-App-Sync/1.0' }
    });
    if (!res.ok) {
      return Response.json({ error: `Failed to fetch site: ${res.status}` }, { status: 502 });
    }
    const html = await res.text();

    // Trim to the relevant page sections to keep the LLM prompt small.
    const featuredStart = html.indexOf('Featured Stories');
    const eventsStart = html.indexOf('Upcoming Events');
    let relevant = html;
    if (featuredStart !== -1 && eventsStart !== -1) {
      relevant = html.slice(featuredStart, eventsStart + 6000);
    } else if (eventsStart !== -1) {
      relevant = html.slice(Math.max(0, eventsStart - 2000), eventsStart + 6000);
    }

    const extraction = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are parsing the HTML of the CWA Local 6143 website homepage. Extract two lists and return them as a JSON object.

1. "stories" — the featured news stories listed on the page. For each story provide:
   - title (string)
   - date (string, exactly as shown, e.g. "31 Aug, 2026")
   - category (string, the section label such as "Meetings & Events" or "Member Resources")
   - image (the full https URL of the story's featured image; prefer the cwa6143.org .../styles/featured_image_small/... URL)
   - excerpt (a short summary sentence if one is present, otherwise empty string)
   - url (the full https URL the story links to)

2. "events" — the upcoming events listed on the page. For each event provide:
   - day (string, e.g. "10")
   - month (string, e.g. "Sep")
   - title (string)
   - time (string, e.g. "7:30 PM – 9:00 PM")
   - note (string, any extra description, otherwise empty string)
   - location (string, otherwise empty string)
   - url (full https URL the event links to)

Only include items that are actually present in the HTML. Do not invent items. Return only the JSON object.

HTML:
${relevant}`,
      response_json_schema: {
        type: 'object',
        properties: {
          stories: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                date: { type: 'string' },
                category: { type: 'string' },
                image: { type: 'string' },
                excerpt: { type: 'string' },
                url: { type: 'string' }
              }
            }
          },
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                day: { type: 'string' },
                month: { type: 'string' },
                title: { type: 'string' },
                time: { type: 'string' },
                note: { type: 'string' },
                location: { type: 'string' },
                url: { type: 'string' }
              }
            }
          }
        }
      }
    });

    const stories = (extraction && extraction.stories) || [];
    const events = (extraction && extraction.events) || [];
    const syncDate = new Date().toISOString();

    // Replace the previous synced set entirely with the freshly extracted one.
    await base44.asServiceRole.entities.NewsArticle.deleteMany({});
    await base44.asServiceRole.entities.EventItem.deleteMany({});

    if (stories.length) {
      await base44.asServiceRole.entities.NewsArticle.bulkCreate(
        stories.map((s) => ({
          title: s.title || '',
          date: s.date || '',
          category: s.category || '',
          image: s.image || '',
          excerpt: s.excerpt || '',
          url: s.url || '',
          sync_date: syncDate
        }))
      );
    }
    if (events.length) {
      await base44.asServiceRole.entities.EventItem.bulkCreate(
        events.map((e) => ({
          day: e.day || '',
          month: e.month || '',
          title: e.title || '',
          time: e.time || '',
          note: e.note || '',
          location: e.location || '',
          url: e.url || '',
          sync_date: syncDate
        }))
      );
    }

    return Response.json({
      ok: true,
      stories: stories.length,
      events: events.length,
      sync_date: syncDate
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}