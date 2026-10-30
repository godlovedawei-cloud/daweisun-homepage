// The build script derives this version from every offline asset and this worker.
const CACHE_VERSION = '502d2fccf5e4e791';
const PREFIX = 'daweisun-pediatric-anesthesia-';
const CACHE = PREFIX + CACHE_VERSION;
const FILES = ['./', './index.html', './app.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const urls = FILES.map(path => new URL(path, self.registration.scope).href);

async function populate() {
  const cache = await caches.open(CACHE);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    // addAll is atomic: a failed download never replaces a working cache.
    await cache.addAll(urls.map(url => new Request(url, { cache: 'reload', signal: controller.signal })));
  } finally { clearTimeout(timeout); }
}
async function complete() {
  const cache = await caches.open(CACHE);
  const entries = await Promise.all(urls.map(url => cache.match(url)));
  return entries.every(Boolean);
}
self.addEventListener('install', event => { event.waitUntil(populate()); });
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Never remove caches belonging to the homepage or any other application.
    if (!await complete()) throw new Error('Offline cache incomplete');
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') { event.waitUntil(self.skipWaiting()); return; }
  if (!['STATUS', 'REPAIR'].includes(event.data?.type)) return;
  event.waitUntil((async () => {
    try {
      if (event.data.type === 'REPAIR') await populate();
      event.ports[0]?.postMessage({ ready: await complete(), version: CACHE_VERSION });
    } catch { event.ports[0]?.postMessage({ ready: false }); }
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Exact application assets only. No catch-all fallback for the personal site.
  const clean = url.origin + url.pathname;
  if (!urls.includes(clean)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(clean);
    if (hit) return hit;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try { return await fetch(event.request, { signal: controller.signal }); }
    finally { clearTimeout(timeout); }
  })());
});
