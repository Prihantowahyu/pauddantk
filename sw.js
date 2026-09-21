/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Service Worker â€” Petualangan bersama Harsha
   Offline-first: App Shell Cache + Network Fallback
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const CACHE_NAME  = 'harsha-edu-v13';
const FONT_CACHE  = 'harsha-fonts-v1';
const OFFLINE_URL = './offline.html';

/* Aset App Shell */
const SHELL_ASSETS = [
  './',
  './index.html',
  './nusa_pintar.html',
  './worksheet_game.html',
  './offline.html',
  './manifest.json',
  './logo_harsha.png',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png',
];

/* INSTALL â€” cache semua halaman & aset */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        SHELL_ASSETS.map(url =>
          fetch(url, { cache: 'reload' })
            .then(res => { if (res.ok) return cache.put(url, res); })
            .catch(() => {})
        )
      );
    }).then(() => self.skipWaiting())
  );
});

/* ACTIVATE â€” hapus cache lama */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== FONT_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* FETCH â€” strategi per tipe */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (!url.protocol.startsWith('http')) return;

  /* 1. Google Fonts â€” Cache-First */
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(FONT_CACHE).then(fc =>
        fc.match(req).then(cached => {
          if (cached) { fetch(req).then(r => { if (r && r.ok) fc.put(req, r.clone()); }).catch(() => {}); return cached; }
          return fetch(req).then(r => { if (r && r.ok) fc.put(req, r.clone()); return r; }).catch(() => new Response('', {status:503}));
        })
      )
    );
    return;
  }

  const same = url.origin === self.location.origin;

  /* 2. Navigasi HTML â€” Network-First, fallback offline.html */
  if (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname === '') {
    event.respondWith(
      fetch(req).then(r => {
        if (r && r.ok && same) caches.open(CACHE_NAME).then(c => c.put(req, r.clone()));
        return r;
      }).catch(() =>
        caches.match(req)
          .then(c => c || caches.match(OFFLINE_URL))
          .then(c => c || caches.match('./index.html'))
      )
    );
    return;
  }

  /* 3. Aset Statis â€” Cache-First dengan background revalidate */
  if (same) {
    event.respondWith(
      caches.match(req).then(cached => {
        const net = fetch(req).then(r => { if (r && r.ok) caches.open(CACHE_NAME).then(c => c.put(req, r.clone())); return r; }).catch(() => null);
        return cached || net.then(r => r || new Response('Not found', {status:404}));
      })
    );
    return;
  }

  /* 4. Lainnya â€” passthrough */
  event.respondWith(fetch(req).catch(() => new Response('Offline', {status:503})));
});