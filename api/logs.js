// GET /api/logs — the dashboard reads every event (needs the x-admin-key header).
// DELETE /api/logs?clear=preview — removes only test (?preview) events; ?clear=all wipes all.
const { redis, parseEvents, KEY } = require('./_store');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) return res.status(503).json({ error: 'ADMIN_KEY is not set in Vercel → Settings → Environment Variables' });
  if (req.headers['x-admin-key'] !== adminKey) return res.status(401).json({ error: 'Wrong key' });

  try {
    if (req.method === 'GET') {
      const [list] = await redis([['LRANGE', KEY, 0, -1]]);
      return res.status(200).json({ ok: true, events: parseEvents(list) });
    }

    if (req.method === 'DELETE') {
      const mode = req.query.clear;
      if (mode === 'all') {
        await redis([['DEL', KEY]]);
        return res.status(200).json({ ok: true, kept: 0 });
      }
      if (mode === 'preview') {
        const [list] = await redis([['LRANGE', KEY, 0, -1]]);
        const keep = (list || []).filter((s) => {
          try { return !JSON.parse(s).preview; } catch (e) { return false; }
        });
        const commands = [['DEL', KEY]];
        if (keep.length) commands.push(['RPUSH', KEY, ...keep]);
        await redis(commands);
        return res.status(200).json({ ok: true, kept: keep.length });
      }
      return res.status(400).json({ error: 'Use ?clear=preview or ?clear=all' });
    }

    return res.status(405).json({ error: 'GET or DELETE only' });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
};
