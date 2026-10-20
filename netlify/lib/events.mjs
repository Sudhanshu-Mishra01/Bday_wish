// Shared logic for the activity log on Netlify (the same API as api/*.js on Vercel).
// Events live in Netlify Blobs, which every Netlify site has built in: no database to set up.
// The only setting needed is ADMIN_KEY (Site configuration → Environment variables).

const KEY = 'events';
const MAX_EVENTS = 3000;
const TYPE_RE = /^[a-z_]{1,24}$/;
const MAX_BYTES = 4000;

const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

async function readAll(store) {
  const list = await store.get(KEY, { type: 'json' });
  return Array.isArray(list) ? list : [];
}

// POST /api/log — the birthday site records one activity event (answer, wish, look…)
export async function handleLog(req, store) {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  let body = {};
  try { body = await req.json(); } catch (e) { body = {}; }
  body = body && typeof body === 'object' ? body : {};

  const isObj = body.data && typeof body.data === 'object' && !Array.isArray(body.data);
  const entry = {
    type: String(body.type || ''),
    data: isObj ? body.data : {},
    at: String(body.at || '').slice(0, 40),
    device: String(body.device || '').slice(0, 24),
    preview: Boolean(body.preview),
    t: Date.now()
  };
  if (!TYPE_RE.test(entry.type)) return json({ error: 'Bad event type' }, 400);
  if (Buffer.byteLength(JSON.stringify(entry)) > MAX_BYTES) return json({ error: 'Event too large' }, 413);

  // Her phone sends events one at a time, so read-append-write is safe here
  const list = await readAll(store);
  list.push(entry);
  await store.setJSON(KEY, list.slice(-MAX_EVENTS));
  return json({ ok: true });
}

// GET /api/logs — the dashboard reads every event (needs the x-admin-key header).
// DELETE /api/logs?clear=preview removes only test (?preview) events; ?clear=all wipes all.
export async function handleLogs(req, store, adminKey) {
  if (!adminKey) return json({ error: 'ADMIN_KEY is not set in Netlify → Site configuration → Environment variables' }, 503);
  if (req.headers.get('x-admin-key') !== adminKey) return json({ error: 'Wrong key' }, 401);

  if (req.method === 'GET') return json({ ok: true, events: await readAll(store) });

  if (req.method === 'DELETE') {
    const mode = new URL(req.url).searchParams.get('clear');
    if (mode === 'all') {
      await store.delete(KEY);
      return json({ ok: true, kept: 0 });
    }
    if (mode === 'preview') {
      const keep = (await readAll(store)).filter((e) => !e.preview);
      await store.setJSON(KEY, keep);
      return json({ ok: true, kept: keep.length });
    }
    return json({ error: 'Use ?clear=preview or ?clear=all' }, 400);
  }
  return json({ error: 'GET or DELETE only' }, 405);
}
