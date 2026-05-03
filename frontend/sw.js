const CACHE_NAME = 'elected-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/css/animations.css',
  '/js/app.js',
  '/js/timeline.js',
  '/js/chat.js',
  '/js/quiz.js',
  '/js/accessibility.js'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  // Don't cache API requests
  if (event.request.url.includes('/api/')) return;
  
  // Don't intercept cross-origin requests (e.g. YouTube thumbnails, Google Fonts)
  // This prevents opaque responses from causing ERR_FAILED in the Service Worker
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Update cache with fresh version
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
