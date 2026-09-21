/* ─────────────────────────────────────────────────────────────
   Service Worker — Petualangan bersama Harsha
   Strategi: Cache-First untuk aset statis, Network-First untuk navigasi
   ───────────────────────────────────────────────────────────── */

const CACHE_NAME = 'harsha-edu-v1';
const OFFLINE_URL = '/belajartk/index.html';

// Aset yang di-pre-cache saat install
const PRE_CACHE_ASSETS = [
  '/belajartk/index.html',
  '/belajartk/nusa_pintar.html',
  '/belajartk/manifest.json',
  '/belajartk/logo_harsha.png',
  '/belajartk/icons/icon-192x192.png',
  '/belajartk/icons/icon-512x512.png',
];

// ── INSTALL ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching assets...');
      return cache.addAll(PRE_CACHE_ASSETS);
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
  // Hanya tangani request GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Abaikan chrome-extension dan non-http
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Selalu update cache di background (Stale-while-revalidate)
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse; // Langsung kembalikan dari cache
      }

      // Tidak ada di cache — fetch dari network
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
          return networkResponse;
        }

        // Cache response baru
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback ke halaman offline jika navigasi
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
        return new Response('Network error', { status: 408, statusText: 'Network error' });
      });
    })
  );
});
