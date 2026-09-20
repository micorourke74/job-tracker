const TRACKING_KEYS = new Set([
  'utm_source','utm_medium','utm_campaign','utm_term','utm_content','utm_id',
  'gh_src','gh_jid','lever-source','source','ref','referrer','trk','trackingId',
  'mc_cid','mc_eid','fbclid','gclid'
]);

export function normalizeJobUrl(input) {
  if (!input) return '';
  let u;
  try { u = new URL(input); } catch { return String(input).trim(); }
  u.hash = '';
  for (const key of [...u.searchParams.keys()]) {
    if (TRACKING_KEYS.has(key) || key.toLowerCase().startsWith('utm_')) {
      u.searchParams.delete(key);
    }
  }
  u.hostname = u.hostname.toLowerCase();
  if (u.pathname.length > 1) u.pathname = u.pathname.replace(/\/+$/, '');
  const sorted = [...u.searchParams.entries()].sort(([a,av],[b,bv]) => a.localeCompare(b) || av.localeCompare(bv));
  u.search = '';
  for (const [k,v] of sorted) u.searchParams.append(k,v);
  return u.toString();
}

export function dedupeKey(job) {
  const company = String(job.employer || job.company || '').trim().toLowerCase().replace(/\s+/g,' ');
  const req = String(job.requisition_id || job.requisitionId || '').trim().toLowerCase();
  if (company && req) return `req:${company}:${req}`;
  const url = normalizeJobUrl(job.url || job.source?.url || '');
  if (url) return `url:${url}`;
  const title = String(job.title || '').trim().toLowerCase().replace(/\s+/g,' ');
  const location = String(job.location || '').trim().toLowerCase().replace(/\s+/g,' ');
  return `fallback:${company}:${title}:${location}`;
}
