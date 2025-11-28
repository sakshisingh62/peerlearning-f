/**
 * Service Worker for Offline Support and Background Sync
 * 
 * Enables:
 * - Offline app functionality
 * - Cache-first strategy for assets
 * - Background sync queue
 * - Offline data persistence
 */

// Bump cache name to invalidate any old cached assets aggressively
const CACHE_NAME = 'peer-learning-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Cache installation failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network first, then cache
self.addEventListener('fetch', event => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Ignore non-http(s) schemes (e.g., chrome-extension://)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Workaround for Chrome bug with only-if-cached and cross-origin
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;

  // Do not intercept cross-origin requests (e.g., API on :5000 or CDNs)
  if (url.origin !== self.location.origin) return;

  // If somehow an API call on same-origin exists, prefer network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => (response && response.ok ? response : Promise.reject(new Error('Network request failed'))))
        .catch(() => new Response(JSON.stringify({ offline: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    );
    return;
  }

  // Cache-first strategy for same-origin static assets
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;

        return fetch(request)
          .then(response => {
            // Only cache valid same-origin responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                // Best-effort cache put; ignore failures
                cache.put(request, responseToCache).catch(() => {});
              })
              .catch(() => {});

            return response;
          })
          .catch(() => caches.match('/index.html'));
      })
      .catch(() => caches.match('/index.html'))
  );
});

// Handle background sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      syncOfflineData()
        .then(() => {
          console.log('Background sync completed');
        })
        .catch(error => {
          console.error('Background sync failed:', error);
          throw error;
        })
    );
  }
});

// Sync offline data to backend
async function syncOfflineData() {
  // This will be implemented in the app
  console.log('Syncing offline data...');
}

// Handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
