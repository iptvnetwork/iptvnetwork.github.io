const CACHE_NAME = 'iptv-cache-v1';
const OFFLINE_URLS = [
  '/',
  '/index.html',
  '/assets/css/style.css',
  '/assets/js/app.js',
  '/data/channels.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-first for channels.json so we get updates quickly
  if (url.pathname.endsWith('/data/channels.json') || url.pathname.endsWith('/channels.json')) {
    event.respondWith(
      fetch(event.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return resp;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for other assets
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(resp => {
      // Cache fetched response for future
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, resp.clone()));
      return resp;
    })).catch(() => caches.match('/index.html'))
  );
});
