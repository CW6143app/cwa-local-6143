import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const HOME_URL = 'https://cwa6143.org';
const EVENTS_URL = 'https://cwa6143.org/meetings-events';

const SCHEMA = {
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
        },
        required: ['title', 'url']
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
        },
        required: ['title', 'url']
      }
    }
  },
  required: ['stories', 'events']
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const headers = { 'User-Agent': 'CWA6143AppSync/1.0 (+https://cwa6143.base44.app)' };
    const [homeRes, eventsRes] = await Promise.all([
      fetch(HOME_URL, { headers }),
      fetch(EVENTS_URL, { headers })
    ]);

    if (!homeRes.ok || !eventsRes.ok) {
      return Response.json({ error: 'Could not reach cwa6143.org' }, { status: 502 });
    }

    const homeHtml = await homeRes.text();
    const eventsHtml = await eventsRes.text();

    const prompt = `You are extracting content from the CWA Local 6143 website (a Drupal site) for a companion mobile app.

From the HOMEPAGE HTML below, extract the "Featured Stories" section. Each story has:
- title
- date (formatted like "31 Aug, 2026")
- category (e.g. "Meetings & Events" or "Member Resources")
- image URL (prefer the cwa6143.org /sites/default/files/styles/featured_image_small/ .webp URL; do NOT use facebook CDN URLs)
- excerpt (a short summary sentence)
- url (full https://cwa6143.org/... path)
Keep them in the order they appear. Return up to 8 stories.

From the EVENTS PAGE HTML below, extract the "Upcoming Events" list. Each event has:
- day (e.g. "10")
- month (e.g. "Sep")
- title
- time (e.g. "7:30 PM – 9:00 PM")
- note (short description)
- location
- url (full https://cwa6143.org/... path)
Keep them in order.

Return ONLY JSON matching the schema. Use empty strings for any missing text field, never null.

HOMEPAGE HTML:
${homeHtml}

EVENTS PAGE HTML:
${eventsHtml}`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: SCHEMA
    });

    const stories = (result.stories || [])
      .filter((s) => s && s.title && s.url)
      .map((s, i) => ({
        title: String(s.title),
        date: s.date ? String(s.date) : '',
        category: s.category ? String(s.category) : '',
        image: s.image ? String(s.image) : '',
        excerpt: s.excerpt ? String(s.excerpt) : '',
        url: String(s.url),
        sort_order: i
      }));

    const events = (result.events || [])
      .filter((e) => e && e.title && e.url)
      .map((e, i) => ({
        day: e.day ? String(e.day) : '',
        month: e.month ? String(e.month) : '',
        title: String(e.title),
        time: e.time ? String(e.time) : '',
        note: e.note ? String(e.note) : '',
        location: e.location ? String(e.location) : '',
        url: String(e.url),
        sort_order: i
      }));

    // Guard: never wipe existing data if the scrape returned nothing at all.
    if (stories.length === 0 && events.length === 0) {
      return Response.json({ error: 'Scrape returned no content. Website may have changed.' }, { status: 422 });
    }

    await base44.asServiceRole.entities.SyncedStory.deleteMany({});
    await base44.asServiceRole.entities.SyncedEvent.deleteMany({});
    if (stories.length) await base44.asServiceRole.entities.SyncedStory.bulkCreate(stories);
    if (events.length) await base44.asServiceRole.entities.SyncedEvent.bulkCreate(events);

    return Response.json({ ok: true, stories: stories.length, events: events.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}