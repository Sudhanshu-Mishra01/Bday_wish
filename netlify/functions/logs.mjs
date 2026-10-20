// GET / DELETE /api/logs on Netlify (the dashboard) — see netlify/lib/events.mjs
import { getStore } from '@netlify/blobs';
import { handleLogs } from '../lib/events.mjs';

export default async (req) => {
  try {
    const adminKey = globalThis.Netlify?.env.get('ADMIN_KEY') || process.env.ADMIN_KEY;
    return await handleLogs(req, getStore({ name: 'chetna-bday', consistency: 'strong' }), adminKey);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};

export const config = { path: '/api/logs' };
