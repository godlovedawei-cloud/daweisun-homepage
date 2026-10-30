/* Visit metadata only. Never read form fields or other localStorage keys. */
(() => {
  'use strict';
  const ENDPOINT = 'https://daweisun-visit-log.yanxiawei-visit-log.workers.dev/collect';
  const ORIGINS = new Set(['https://daweisun.com', 'https://www.daweisun.com']);
  if (!ORIGINS.has(location.origin)) return;
  const HEARTBEAT_MS = 15000;
  const ACTIVE_WINDOW_MS = 60000;
  const STORAGE_KEY = 'daweisun.analytics.visitor.v1';
  let visitorId = '';
  try {
    visitorId = localStorage.getItem(STORAGE_KEY) || '';
    if (!/^[a-f0-9]{16}$/.test(visitorId)) {
      visitorId = Array.from(crypto.getRandomValues(new Uint8Array(8)), b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(STORAGE_KEY, visitorId);
    }
  } catch { /* Blocked storage permits anonymous session analytics. */ }
  let lastMeasuredAt = Date.now();
  let lastActivityAt = Date.now();
  let wasVisible = document.visibilityState === 'visible';
  let pendingActiveMs = 0;
  let maxScrollPercent = 0;
  let lastSentScrollPercent = 0;
  let pageviewSent = false;
  let referrer = '';
  try { referrer = document.referrer ? new URL(document.referrer).origin : ''; } catch {}

  function measure() {
    const now = Date.now();
    if (wasVisible && navigator.onLine) {
      const activeUntil = Math.min(now, lastActivityAt + ACTIVE_WINDOW_MS);
      pendingActiveMs += Math.max(0, Math.min(HEARTBEAT_MS, activeUntil - lastMeasuredAt));
    }
    lastMeasuredAt = now;
    wasVisible = document.visibilityState === 'visible';
  }
  function scrollPercent() {
    const height = document.documentElement.scrollHeight;
    if (height > 0) maxScrollPercent = Math.max(maxScrollPercent,
      Math.min(100, Math.round((scrollY + innerHeight) / height * 100)));
    return maxScrollPercent;
  }
  function send(event) {
    if (!navigator.onLine) return;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const body = JSON.stringify({
        eventType: event.eventType,
        visitorId,
        path: location.pathname,
        referrer,
        language: navigator.language || '',
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        colorScheme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        maxScrollPercent: scrollPercent(),
        ...event
      });
      fetch(ENDPOINT, {
        method: 'POST', mode: 'cors', credentials: 'omit', keepalive: true,
        referrerPolicy: 'no-referrer', headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body, signal: controller.signal
      }).catch(() => {}).finally(() => clearTimeout(timeout));
    } catch { /* Analytics must never interrupt the page. */ }
  }
  function pageview() {
    if (!pageviewSent && navigator.onLine && document.visibilityState === 'visible') {
      pageviewSent = true;
      send({ eventType: 'pageview' });
    }
  }
  function engagement() {
    measure();
    const percent = scrollPercent();
    if (pageviewSent && navigator.onLine && (pendingActiveMs >= 1000 || percent > lastSentScrollPercent)) {
      send({ eventType: 'engagement', activeSeconds: Math.floor(pendingActiveMs / 1000) });
      lastSentScrollPercent = percent;
    }
    // Drop disconnected intervals rather than replaying them later.
    pendingActiveMs = 0;
  }
  function classify(link) {
    let target;
    try { target = new URL(link.href, location.href); } catch { return null; }
    let type = '';
    if (target.protocol === 'mailto:' && target.pathname === 'dawei.sun.md@gmail.com') type = 'email';
    if (target.protocol === 'https:') {
      if (ORIGINS.has(target.origin) && target.pathname === '/assets/Dawei-Sun-CV.pdf') type = 'cv';
      else if (target.hostname === 'scholar.google.com') type = 'google-scholar';
      else if (target.hostname === 'orcid.org') type = 'orcid';
      else if (target.hostname === 'pubmed.ncbi.nlm.nih.gov') type = 'pubmed';
      else if (target.hostname === 'doi.org') type = 'doi';
      else if (ORIGINS.has(target.origin) && /^\/tools\/(anesthesia-dosing|pediatric-anesthesia)\/$/.test(target.pathname)) type = 'tool';
    }
    if (!type) return null;
    return { linkType: type, linkTarget: target.protocol === 'mailto:' ? `mailto:${target.pathname}` : target.origin + target.pathname };
  }
  document.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest('a[href]');
    const tracked = link && classify(link);
    if (tracked) { pageview(); send({ eventType: 'link-click', ...tracked }); }
  }, { capture: true });
  for (const eventName of ['keydown', 'pointerdown', 'pointermove', 'scroll', 'touchstart']) {
    window.addEventListener(eventName, () => { measure(); lastActivityAt = Date.now(); }, { passive: true });
  }
  document.addEventListener('visibilitychange', () => {
    engagement();
    if (document.visibilityState === 'visible') { lastActivityAt = Date.now(); pageview(); }
  });
  window.addEventListener('pagehide', engagement);
  window.addEventListener('pageshow', event => {
    if (event.persisted) { pageviewSent = false; lastMeasuredAt = lastActivityAt = Date.now(); wasVisible = document.visibilityState === 'visible'; pageview(); }
  });
  window.addEventListener('offline', () => { pendingActiveMs = 0; lastMeasuredAt = Date.now(); });
  window.addEventListener('online', () => { pendingActiveMs = 0; lastMeasuredAt = lastActivityAt = Date.now(); pageview(); });
  setInterval(() => { pageview(); if (document.visibilityState === 'visible') engagement(); }, HEARTBEAT_MS);
  pageview();
})();
