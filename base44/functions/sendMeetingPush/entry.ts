import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

const PROJECT_ID = 'cwa6143-push';
const SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FCM_URL = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

const NOTIFICATION_TITLE = 'CWA Local 6143';
const NOTIFICATION_BODY = 'CWA Local 6143 Monthly Meeting has started';

function b64urlStr(str) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(str)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function bufToB64url(buf) {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToDer(pem) {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function getAccessToken(clientEmail, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${b64urlStr(JSON.stringify(header))}.${b64urlStr(JSON.stringify(payload))}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(privateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsigned)
  );
  const jwt = `${unsigned}.${bufToB64url(sig)}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OAuth token failed: ${res.status} ${txt}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function sendToToken(accessToken, token) {
  const res = await fetch(FCM_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token,
        notification: { title: NOTIFICATION_TITLE, body: NOTIFICATION_BODY },
        webpush: {
          notification: {
            title: NOTIFICATION_TITLE,
            body: NOTIFICATION_BODY,
            requireInteraction: true,
          },
          fcm_options: { link: 'https://cwa6143.base44.app/events' },
        },
      },
    }),
  });
  return res.ok;
}

function resolveCredentials() {
  let clientEmail;
  let privateKey;
  const sa = secrets.get('FIREBASE_SERVICE_ACCOUNT');
  if (sa) {
    try {
      const parsed = JSON.parse(sa);
      clientEmail = parsed.client_email;
      privateKey = parsed.private_key;
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON');
    }
  } else {
    clientEmail = secrets.get('FCM_CLIENT_EMAIL');
    privateKey = secrets.get('FCM_PRIVATE_KEY');
  }
  if (!clientEmail || !privateKey) {
    throw new Error('FCM credentials not configured');
  }
  privateKey = privateKey.replace(/\\n/g, '\n').trim();
  return { clientEmail, privateKey };
}

async function broadcastPush(base44, clientEmail, privateKey) {
  const tokens = await base44.asServiceRole.entities.PushToken.list('-created_date', 1000);
  const list = Array.isArray(tokens) ? tokens : [];
  if (list.length === 0) {
    return { sent: 0, failed: 0, total: 0, message: 'No devices registered for push.' };
  }
  const accessToken = await getAccessToken(clientEmail, privateKey);
  let sent = 0;
  let failed = 0;
  for (const t of list) {
    try {
      const ok = await sendToToken(accessToken, t.token);
      if (ok) sent++; else failed++;
    } catch {
      failed++;
    }
  }
  return { sent, failed, total: list.length };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try { body = await req.json(); } catch {}
    const { clientEmail, privateKey } = resolveCredentials();

    // Workflow path: dedup per event so each meeting notifies at most once.
    if (body.event_id) {
      const event = await base44.asServiceRole.entities.SyncedEvent.get(body.event_id);
      if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });
      if (event.meeting_notified) {
        return Response.json({ sent: 0, skipped: true, message: 'Already notified for this meeting.' });
      }
      if (!event.join_meeting_url) {
        return Response.json({ sent: 0, skipped: true, message: 'Join meeting not enabled.' });
      }
      const result = await broadcastPush(base44, clientEmail, privateKey);
      await base44.asServiceRole.entities.SyncedEvent.update(body.event_id, { meeting_notified: true });
      return Response.json(result);
    }

    // Manual admin path (dashboard test)
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const result = await broadcastPush(base44, clientEmail, privateKey);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}