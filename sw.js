/* ─────────────────────────────────────────────────────────────
   Service Worker — Petualangan bersama Harsha
   Menggunakan path RELATIF agar bekerja di GitHub Pages maupun XAMPP
   ───────────────────────────────────────────────────────────── */

const CACHE_NAME = 'harsha-edu-v7';

// Aset yang di-pre-cache — path relatif terhadap sw.js
const PRE_CACHE_ASSETS = [
  './',
  './index.html',
  './nusa_pintar.html',
  './worksheet_game.html',
  './manifest.json',
  './logo_harsha.png',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
];

// ── INSTALL ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching assets...');
      return Promise.allSettled(
        PRE_CACHE_ASSETS.map(url =>
          fetch(url).then(res => {
            if (res.ok) return cache.put(url, res);
          }).catch(() => {})
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  const isSameOrigin = url.origin === self.location.origin;
  const isHtml = event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');

  // 1. Network-First untuk HTML agar perubahan terbaru langsung terlihat
  if (isHtml) {
    event.respondWith(
      fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && isSameOrigin) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(event.request).then(cached => cached || caches.match('./index.html'));
      })
    );
    return;
  }

  // 2. Cache-First dengan background revalidate untuk aset statis (gambar, font, css)
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        if (isSameOrigin) {
          fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
            }
          }).catch(() => {});
        }
        return cachedResponse;
      }

      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        if (isSameOrigin) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        }

        return networkResponse;
      }).catch(() => {
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
