// POST /api/log on Netlify — see netlify/lib/events.mjs
import { getStore } from '@netlify/blobs';
import { handleLog } from '../lib/events.mjs';

export default async (req) => {
  try {
    return await handleLog(req, getStore({ name: 'chetna-bday', consistency: 'strong' }));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};

export const config = { path: '/api/log' };
