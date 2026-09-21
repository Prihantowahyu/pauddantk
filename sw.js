/* ─────────────────────────────────────────────────────────────
   Service Worker — Petualangan bersama Harsha
   Menggunakan path RELATIF agar bekerja di GitHub Pages maupun XAMPP
   ───────────────────────────────────────────────────────────── */

const CACHE_NAME = 'harsha-edu-v2';

// Aset yang di-pre-cache — path relatif terhadap sw.js
const PRE_CACHE_ASSETS = [
  './',
  './index.html',
  './nusa_pintar.html',
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
      // addAll bisa gagal jika salah satu file 404, gunakan individual put
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

  // Jangan cache request ke domain lain (misal Google Fonts)
  const isSameOrigin = url.origin === self.location.origin;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Kembalikan cache dulu, update di background
      if (cachedResponse) {
        if (isSameOrigin) {
          // Stale-while-revalidate
          fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse);
              });
            }
          }).catch(() => {});
        }
        return cachedResponse;
      }

      // Tidak ada di cache — fetch dari network
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        if (isSameOrigin) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }

        return networkResponse;
      }).catch(() => {
        // Fallback ke index.html jika navigasi
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('Network error', { status: 408 });
      });
    })
  );
});
