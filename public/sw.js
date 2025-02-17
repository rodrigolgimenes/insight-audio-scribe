
const CACHE_VERSION = 'v1';
const CACHE_NAME = `lovable-cache-${CACHE_VERSION}`;

const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('[Service Worker] Caching static resources');
      await cache.addAll(STATIC_RESOURCES);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheKeys = await caches.keys();
      const deletions = cacheKeys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key));
      await Promise.all(deletions);
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  // Don't cache blob URLs
  if (event.request.url.startsWith('blob:')) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      
      try {
        // Try cache first
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If not in cache, get from network
        const response = await fetch(event.request);
        
        // Don't cache non-successful responses or blob URLs
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }

        // Clone the response before caching it
        cache.put(event.request, response.clone());
        return response;
      } catch (error) {
        console.error('[Service Worker] Fetch failed:', error);
        throw error;
      }
    })()
  );
});
