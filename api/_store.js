// Shared storage for the activity log: Upstash Redis over its REST API.
// Connect it in Vercel → Storage → "Upstash for Redis"; Vercel then injects the
// URL/token env vars below. No npm packages needed.
// (Files starting with "_" inside api/ are helpers, not endpoints.)

const REST_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const KEY = 'chetna_bday_events';
const MAX_EVENTS = 3000;

async function redis(commands) {
  if (!REST_URL || !REST_TOKEN) {
    const err = new Error('Storage not connected — add Upstash for Redis in Vercel → Storage');
    err.status = 503;
    throw err;
  }
  const res = await fetch(`${REST_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REST_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands)
  });
  if (!res.ok) throw new Error(`Redis error ${res.status}`);
  const out = await res.json();
  const failed = out.find((r) => r.error);
  if (failed) throw new Error(failed.error);
  return out.map((r) => r.result);
}

function parseEvents(list) {
  return (list || []).map((s) => {
    try { return JSON.parse(s); } catch (e) { return null; }
  }).filter(Boolean);
}

module.exports = { redis, parseEvents, KEY, MAX_EVENTS };
