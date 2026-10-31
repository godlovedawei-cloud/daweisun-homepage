import { adminPage } from './admin.js';

const MAX_BODY_BYTES = 8192;
const EVENTS = new Set(['pageview', 'engagement', 'link-click']);
const PATHS = new Set(['/', '/index.html', '/publications.html', '/tools/anesthesia-dosing/', '/tools/anesthesia-dosing/index.html', '/tools/pediatric-anesthesia/', '/tools/pediatric-anesthesia/index.html']);
const LINK_HOSTS = new Map([['scholar.google.com', 'google-scholar'], ['orcid.org', 'orcid'], ['doi.org', 'doi'], ['pubmed.ncbi.nlm.nih.gov', 'pubmed']]);
const SECURITY = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY' };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...SECURITY, 'Content-Type': 'application/json; charset=utf-8' } });
const clean = (value, max = 160) => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max) : '';
const number = (value, max) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(max, Math.round(value))) : 0;
function origins(env) { return new Set(String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)); }
function cors(origin) { return { ...SECURITY, 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', 'Vary': 'Origin' }; }
function originOnly(value) {
  try { const u = new URL(value); return ['http:', 'https:'].includes(u.protocol) ? u.origin : ''; } catch { return ''; }
}
function pathOnly(value) {
  if (typeof value !== 'string') return '';
  const path = value.split(/[?#]/, 1)[0];
  return PATHS.has(path) ? path : '';
}
function linkFields(payload, env) {
  try {
    const target = new URL(payload.linkTarget);
    let type = '';
    if (target.protocol === 'mailto:' && target.pathname === 'dawei.sun.md@gmail.com') type = 'email';
    if (target.protocol === 'https:' && !target.username && !target.password) {
      type = LINK_HOSTS.get(target.hostname) || '';
      if (origins(env).has(target.origin)) {
        if (target.pathname === '/assets/Dawei-Sun-CV.pdf') type = 'cv';
        else if (/^\/tools\/(anesthesia-dosing|pediatric-anesthesia)\/$/.test(target.pathname)) type = 'tool';
      }
    }
    if (!type || payload.linkType !== type) return null;
    return { linkType: type, linkTarget: clean(target.protocol === 'mailto:' ? `mailto:${target.pathname}` : target.origin + target.pathname, 300) };
  } catch { return null; }
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/collect') return await collect(request, env);
      if (!['GET', 'HEAD'].includes(request.method)) return json({ error: 'Method not allowed' }, 405);
      if (url.pathname === '/health') return json({ ok: true });
      if (url.pathname === '/admin') {
        const nonce = crypto.randomUUID();
        return new Response(request.method === 'HEAD' ? null : adminPage(nonce), { headers: {
          ...SECURITY, 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow',
          'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`
        } });
      }
      if (url.pathname === '/api/visits') {
        if (!await authorized(request, env)) return json({ error: 'Unauthorized' }, 401);
        const cursor = url.searchParams.get('cursor') || undefined;
        if (cursor && (cursor.length > 2048 || !/^[a-zA-Z0-9_+/=-]+$/.test(cursor))) return json({ error: 'Invalid cursor' }, 400);
        const page = await loadRows(env, cursor);
        return json({ totalEventsLoaded: page.rows.length, retentionDays: 90,
          firstEvent: page.rows.at(-1)?.timestamp || null, lastEvent: page.rows[0]?.timestamp || null,
          nextCursor: page.nextCursor, visitors: aggregateVisitors(page.rows) });
      }
      return json({ error: 'Not found' }, 404);
    } catch (error) {
      console.error('visit-log request failed', error?.name || 'Error');
      return json({ error: 'Visit log temporarily unavailable' }, 503);
    }
  }
};
async function collect(request, env) {
  const origin = request.headers.get('Origin') || '';
  if (!origins(env).has(origin)) return json({ error: 'Forbidden' }, 403);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  const respond = (data, status) => new Response(data === null ? null : JSON.stringify(data), { status, headers: { ...cors(origin), 'Content-Type': 'application/json' } });
  if (request.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);
  const mime = (request.headers.get('Content-Type') || '').split(';')[0];
  if (!['text/plain', 'application/json'].includes(mime)) return respond({ error: 'Unsupported content type' }, 415);
  if (Number(request.headers.get('Content-Length')) > MAX_BODY_BYTES) return respond({ error: 'Payload too large' }, 413);
  let payload;
  try {
    const body = await limitedBody(request);
    if (body === null) return respond({ error: 'Payload too large' }, 413);
    payload = JSON.parse(body);
  } catch { return respond({ error: 'Invalid JSON or timed out request' }, 400); }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) || !EVENTS.has(payload.eventType) || !pathOnly(payload.path)) {
    return respond({ error: 'Invalid event' }, 400);
  }
  let metrics = {};
  if (payload.metricsVersion !== undefined) {
    if (payload.metricsVersion !== 2 || typeof payload.pageViewId !== 'string' || !/^[a-f0-9]{32}$/.test(payload.pageViewId) ||
        ![payload.visibleMs, payload.activeMs].every(value => Number.isInteger(value) && value >= 0)) {
      return respond({ error: 'Invalid cumulative metrics' }, 400);
    }
    const visibleMs = number(payload.visibleMs, 7 * 86400000);
    metrics = { metricsVersion: 2, pageViewId: payload.pageViewId, visibleMs, activeMs: Math.min(number(payload.activeMs, 7 * 86400000), visibleMs) };
  }
  const link = payload.eventType === 'link-click' ? linkFields(payload, env) : {};
  if (!link) return respond({ error: 'Invalid link' }, 400);
  const now = Date.now();
  const cf = request.cf || {};
  const userAgent = clean(request.headers.get('User-Agent'), 300);
  const row = {
    timestamp: new Date(now).toISOString(), eventType: payload.eventType,
    ip: clean(request.headers.get('CF-Connecting-IP'), 80) || 'unknown',
    visitorId: typeof payload.visitorId === 'string' && /^[a-f0-9]{16}$/.test(payload.visitorId) ? payload.visitorId : '',
    path: pathOnly(payload.path), referrer: originOnly(payload.referrer),
    country: clean(cf.country, 80), region: clean(cf.region, 120), city: clean(cf.city, 120),
    timezone: clean(cf.timezone, 80), asn: number(cf.asn, 4294967295) || null,
    asOrganization: clean(cf.asOrganization, 180),
    language: clean(payload.language, 80), screen: /^\d{1,5}x\d{1,5}$/.test(payload.screen) ? payload.screen : '',
    browserTimezone: clean(payload.timezone, 80), colorScheme: ['light', 'dark'].includes(payload.colorScheme) ? payload.colorScheme : '',
    userAgent, ...parseUserAgent(userAgent),
    activeSeconds: payload.eventType === 'engagement' ? number(payload.activeSeconds, 60) : 0,
    maxScrollPercent: number(payload.maxScrollPercent, 100), ...link, ...metrics
  };
  // Fixed width reverse timestamp: lexical order is newest first without scanning history.
  const key = `visit:${String(9999999999999 - now).padStart(13, '0')}:${crypto.randomUUID()}`;
  await env.VISIT_LOGS.put(key, JSON.stringify(row), { expirationTtl: 90 * 86400 });
  return respond(null, 204);
}
async function limitedBody(request) {
  const reader = request.body?.getReader();
  if (!reader) return '';
  let timeout;
  const deadline = new Promise((_, reject) => { timeout = setTimeout(() => { void reader.cancel().catch(() => {}); reject(new Error('Body timeout')); }, 30000); });
  try {
    const chunks = []; let size = 0;
    while (true) {
      const { value, done } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) { void reader.cancel().catch(() => {}); return null; }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return new TextDecoder().decode(bytes);
  } finally { clearTimeout(timeout); }
}
async function authorized(request, env) {
  const expected = String(env.ADMIN_TOKEN || '');
  const supplied = (request.headers.get('Authorization') || '').replace(/^Bearer /, '');
  if (!expected || expected.length > 256 || !supplied || supplied.length > 256) return false;
  const digest = value => crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  const [a, b] = await Promise.all([digest(expected), digest(supplied)]);
  const x = new Uint8Array(a), y = new Uint8Array(b); let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0 && request.headers.get('Authorization').startsWith('Bearer ');
}
export async function loadRows(env, cursor) {
  const result = await env.VISIT_LOGS.list({ prefix: 'visit:', limit: 500, ...(cursor ? { cursor } : {}) });
  const rows = [];
  for (let i = 0; i < result.keys.length; i += 100) {
    const values = await env.VISIT_LOGS.get(result.keys.slice(i, i + 100).map(key => key.name), 'json');
    for (const value of values.values()) if (value && typeof value === 'object') rows.push(value);
  }
  rows.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return { rows, nextCursor: result.list_complete ? null : result.cursor };
}
export function aggregateVisitors(rows) {
  const grouped = new Map();
  for (const row of rows) {
    const key = `${row.ip}|${row.visitorId || 'anonymous'}`;
    let v = grouped.get(key);
    if (!v) {
      v = { ip: row.ip, visitorId: row.visitorId || 'anonymous', visitCount: 0, firstSeen: row.timestamp, lastSeen: row.timestamp,
        country: row.country, region: row.region, city: row.city, timezone: row.timezone, asn: row.asn, asOrganization: row.asOrganization,
        deviceType: row.deviceType, browser: row.browser, os: row.os, browserTimezone: row.browserTimezone, colorScheme: row.colorScheme,
        paths: new Set(), referrers: new Set(), linkClicks: {}, totalActiveSeconds: 0, maxScrollPercent: 0,
        legacyEventCount: 0, legacyActiveSeconds: 0, legacyDisplayDepthPercent: 0, visits: new Map() };
      grouped.set(key, v);
    }
    if (row.timestamp < v.firstSeen) v.firstSeen = row.timestamp;
    if (row.timestamp > v.lastSeen) v.lastSeen = row.timestamp;
    if (row.path) v.paths.add(row.path);
    if (row.referrer) v.referrers.add(row.referrer);
    if (row.eventType === 'link-click' && row.linkType) v.linkClicks[row.linkType] = (v.linkClicks[row.linkType] || 0) + 1;
    if (row.metricsVersion === 2 && row.pageViewId) {
      // One cumulative maximum per page load: duplicates, loss and out-of-order delivery cannot add time twice.
      const visitKey = `${row.path}|${row.pageViewId}`;
      let visit = v.visits.get(visitKey);
      if (!visit) {
        visit = { pageViewId: row.pageViewId, path: row.path, firstSeen: row.timestamp, lastSeen: row.timestamp,
          visibleMs: 0, activeMs: 0, maxScrollPercent: 0 };
        v.visits.set(visitKey, visit);
      }
      if (row.timestamp < visit.firstSeen) visit.firstSeen = row.timestamp;
      if (row.timestamp > visit.lastSeen) visit.lastSeen = row.timestamp;
      visit.visibleMs = Math.max(visit.visibleMs, row.visibleMs || 0);
      visit.activeMs = Math.max(visit.activeMs, row.activeMs || 0);
      visit.maxScrollPercent = Math.max(visit.maxScrollPercent, row.maxScrollPercent || 0);
    } else {
      v.legacyEventCount++;
      if (row.eventType === 'pageview') v.visitCount++;
      if (row.eventType === 'engagement') v.legacyActiveSeconds += row.activeSeconds || 0;
      v.legacyDisplayDepthPercent = Math.max(v.legacyDisplayDepthPercent, row.maxScrollPercent || 0);
    }
  }
  return Array.from(grouped.values(), v => {
    const visits = [...v.visits.values()].sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
    const visibleMs = visits.reduce((sum, visit) => sum + visit.visibleMs, 0);
    const activeMs = visits.reduce((sum, visit) => sum + visit.activeMs, 0);
    return { ...v, paths: [...v.paths], referrers: [...v.referrers], visits,
      visitCount: v.visitCount + visits.length, totalVisibleSeconds: Math.floor(visibleMs / 1000),
      totalActiveSeconds: Math.floor(activeMs / 1000) + v.legacyActiveSeconds,
      totalMeasuredActiveSeconds: Math.floor(activeMs / 1000),
      // Retained for older API consumers. The dashboard uses per-visit progress instead.
      maxScrollPercent: Math.max(v.legacyDisplayDepthPercent, ...visits.map(visit => visit.maxScrollPercent)) };
  }).sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
}
function parseUserAgent(ua) {
  return {
    deviceType: /ipad|tablet/i.test(ua) ? 'tablet' : /mobi|iphone|android/i.test(ua) ? 'mobile' : 'desktop',
    browser: /edg\//i.test(ua) ? 'Edge' : /opr\//i.test(ua) ? 'Opera' : /chrome|crios/i.test(ua) ? 'Chrome' : /firefox|fxios/i.test(ua) ? 'Firefox' : /safari/i.test(ua) ? 'Safari' : 'Unknown',
    os: /windows nt/i.test(ua) ? 'Windows' : /iphone|ipad|ipod/i.test(ua) ? 'iOS' : /android/i.test(ua) ? 'Android' : /mac os x|macintosh/i.test(ua) ? 'macOS' : /linux/i.test(ua) ? 'Linux' : 'Unknown'
  };
}
