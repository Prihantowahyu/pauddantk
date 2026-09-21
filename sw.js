/* -----------------------------------------------------------
   Service Worker — Petualangan bersama Harsha
   Offline-first: App Shell Cache + Network Fallback
----------------------------------------------------------- */

const CACHE_NAME  = 'harsha-edu-v14';
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

/* INSTALL — cache semua halaman & aset */
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

/* ACTIVATE — hapus cache lama */
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

/* FETCH — strategi per tipe */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1. Google Fonts
  if (url.hostname.includes('fonts.gstatic.com') || url.hostname.includes('fonts.googleapis.com')) {
    event.respondWith(
      caches.open(FONT_CACHE).then(cache =>
        cache.match(req).then(cached => {
          if (cached) return cached;
          return fetch(req)
            .then(res => {
              if (res.ok) cache.put(req, res.clone());
              return res;
            })
            .catch(() => new Response('', { status: 200 }));
        })
      )
    );
    return;
  }

  // 2. HTML navigation
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) {
          fetch(req).then(res => {
            if (res && res.ok) caches.open(CACHE_NAME).then(c => c.put(req, res));
          }).catch(() => {});
          return cached;
        }
        return fetch(req)
          .then(res => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then(c => c.put(req, clone));
            }
            return res;
          })
          .catch(() => caches.match(OFFLINE_URL));
      })
    );
    return;
  }

  // 3. Static assets
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => new Response('', { status: 404 }));
    })
  );
});