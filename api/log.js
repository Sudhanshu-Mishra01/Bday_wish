// POST /api/log — the birthday site records one activity event (answer, wish, look…)
const { redis, KEY, MAX_EVENTS } = require('./_store');

const TYPE_RE = /^[a-z_]{1,24}$/;
const MAX_BYTES = 4000;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const isObj = body.data && typeof body.data === 'object' && !Array.isArray(body.data);
  const entry = {
    type: String(body.type || ''),
    data: isObj ? body.data : {},
    at: String(body.at || '').slice(0, 40),
    device: String(body.device || '').slice(0, 24),
    preview: Boolean(body.preview),
    t: Date.now()
  };
  if (!TYPE_RE.test(entry.type)) return res.status(400).json({ error: 'Bad event type' });

  const line = JSON.stringify(entry);
  if (Buffer.byteLength(line) > MAX_BYTES) return res.status(413).json({ error: 'Event too large' });

  try {
    await redis([['RPUSH', KEY, line], ['LTRIM', KEY, -MAX_EVENTS, -1]]);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
};
