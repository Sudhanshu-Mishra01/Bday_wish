// GET / DELETE /api/logs on Netlify (the dashboard) — see netlify/lib/events.mjs
import { getStore } from '@netlify/blobs';
import { handleLogs } from '../lib/events.mjs';

const readEnv = (name) => (globalThis.Netlify?.env.get(name) || process.env[name] || '').trim();

// Shown only when ADMIN_KEY is missing, so the 503 says what this function can actually see.
// Names only, never values, and only names containing "admin".
function envDiagnostics(context) {
  const names = new Set(Object.keys(process.env));
  try { Object.keys(globalThis.Netlify?.env.toObject?.() || {}).forEach((n) => names.add(n)); } catch (e) { /* ignore */ }
  return {
    deployContext: context?.deploy?.context || null,
    deployId: context?.deploy?.id || null,
    adminLikeVarNames: [...names].filter((n) => /admin/i.test(n))
  };
}

export default async (req, context) => {
  try {
    const adminKey = readEnv('ADMIN_KEY');
    return await handleLogs(req, getStore({ name: 'chetna-bday', consistency: 'strong' }), adminKey, adminKey ? null : envDiagnostics(context));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
};

export const config = { path: '/api/logs' };
