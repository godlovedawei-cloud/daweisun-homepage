/* Visit metadata only. Never read form fields or other localStorage keys. */
(() => {
  'use strict';
  const ENDPOINT = 'https://daweisun-visit-log.yanxiawei-visit-log.workers.dev/collect';
  const ORIGINS = new Set(['https://daweisun.com', 'https://www.daweisun.com']);
  if (!ORIGINS.has(location.origin)) return;
  const HEARTBEAT_MS = 5000;
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
  const now = () => performance.now();
  const makePageId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
  let pageViewId = makePageId();
  let lastMeasuredAt = now();
  let lastActivityAt = lastMeasuredAt;
  let wasVisible = document.visibilityState === 'visible';
  let wasOnline = navigator.onLine;
  let visibleMs = 0;
  let activeMs = 0;
  let maxScrollPercent = 0;
  let pageviewSent = false;
  let scrollTimer = null;
  let lastSentSignature = '';
  let reportedVisibleMs = 0;
  let reportedActiveMs = 0;
  let reportedScrollPercent = 0;
  let referrer = '';
  try { referrer = document.referrer ? new URL(document.referrer).origin : ''; } catch {}

  function measure() {
    const current = now();
    if (wasVisible && wasOnline) {
      visibleMs += Math.max(0, current - lastMeasuredAt);
      activeMs += Math.max(0, Math.min(current, lastActivityAt + ACTIVE_WINDOW_MS) - lastMeasuredAt);
    }
    lastMeasuredAt = current;
    wasVisible = document.visibilityState === 'visible';
    wasOnline = navigator.onLine;
  }
  function scrollPercent() {
    const root = document.scrollingElement || document.documentElement;
    const viewport = document.documentElement.clientHeight;
    const range = Math.max(0, root.scrollHeight - viewport);
    const top = Math.max(0, root.scrollTop);
    // Scroll travel, not the fraction covered by the viewport. Short pages stay at 0.
    const percent = range <= 2 ? 0 : range - top <= 2 ? 100 : Math.min(99, Math.floor(top / range * 100));
    maxScrollPercent = Math.max(maxScrollPercent, percent);
    return maxScrollPercent;
  }
  function send(event) {
    if (!navigator.onLine) return;
    measure();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const body = JSON.stringify({
        eventType: event.eventType,
        visitorId,
        pageViewId,
        metricsVersion: 2,
        visibleMs: Math.floor(visibleMs),
        activeMs: Math.floor(activeMs),
        path: location.pathname,
        referrer,
        language: navigator.language || '',
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        colorScheme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
        maxScrollPercent: scrollPercent(),
        ...event
      });
      reportedVisibleMs = visibleMs; reportedActiveMs = activeMs; reportedScrollPercent = maxScrollPercent;
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
    if (!navigator.onLine || !pageviewSent) return;
    const signature = `${Math.floor(visibleMs)}:${Math.floor(activeMs)}:${scrollPercent()}`;
    if (signature !== lastSentSignature) {
      send({ eventType: 'engagement' });
      lastSentSignature = signature;
    }
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
    window.addEventListener(eventName, () => {
      measure();
      lastActivityAt = now();
      if (eventName === 'scroll' && navigator.onLine) {
        scrollPercent();
        // Capture the furthest position immediately, report at most once per second.
        if (scrollTimer === null) scrollTimer = setTimeout(() => { scrollTimer = null; engagement(); }, 1000);
      }
    }, { passive: true });
  }
  document.addEventListener('visibilitychange', () => {
    engagement();
    if (document.visibilityState === 'visible') { lastActivityAt = now(); pageview(); }
  });
  window.addEventListener('pagehide', () => {
    engagement();
    wasVisible = false;
    if (scrollTimer !== null) { clearTimeout(scrollTimer); scrollTimer = null; }
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      pageViewId = makePageId(); pageviewSent = false;
      visibleMs = activeMs = maxScrollPercent = 0; lastSentSignature = '';
      reportedVisibleMs = reportedActiveMs = reportedScrollPercent = 0;
      lastMeasuredAt = lastActivityAt = now();
      wasVisible = document.visibilityState === 'visible'; wasOnline = navigator.onLine;
      pageview();
    }
  });
  window.addEventListener('offline', () => {
    measure();
    wasOnline = false;
    visibleMs = reportedVisibleMs; activeMs = reportedActiveMs; maxScrollPercent = reportedScrollPercent;
  });
  window.addEventListener('online', () => {
    lastMeasuredAt = lastActivityAt = now();
    wasOnline = true;
    pageview();
  });
  setInterval(() => { pageview(); if (document.visibilityState === 'visible') engagement(); }, HEARTBEAT_MS);
  pageview();
})();
