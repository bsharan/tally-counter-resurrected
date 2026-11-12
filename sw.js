// sw.js — service worker for offline use.
// Caches the app shell so Tally Counter works with no connection.
// All data lives in localStorage, so no network is needed at all after first load.

var CACHE = 'tally-v1';
var SHELL = [
  './',
  './index.html',
  './src/logic.js',
  './src/i18n.js',
  './src/app.js',
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      // addAll is atomic — if any file fails, none are cached.
      return cache.addAll(SHELL);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// Cache-first strategy: serve from cache, fall back to network, cache a copy.
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      if (cached) return cached;
      return fetch(e.request).then(function (resp) {
        // only cache same-origin, ok responses
        if (resp && resp.ok && new URL(e.request.url).origin === self.location.origin) {
          var copy = resp.clone();
          caches.open(CACHE).then(function (cache) { cache.put(e.request, copy); });
        }
        return resp;
      }).catch(function () {
        // offline and not cached — for navigations, serve the cached shell
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('', { status: 504, statusText: 'Offline' });
      });
    })
  );
});
