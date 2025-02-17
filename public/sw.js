
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

  // Skip caching for certain URL schemes
  const url = new URL(event.request.url);
  if (url.protocol === 'chrome-extension:' || 
      url.protocol === 'blob:' || 
      url.pathname.startsWith('/sw.js')) {
    return;
  }

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
        
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }

        // Only cache if it's a valid URL scheme
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          try {
            cache.put(event.request, response.clone());
          } catch (error) {
            console.error('[Service Worker] Cache put failed:', error);
          }
        }

        return response;
      } catch (error) {
        console.error('[Service Worker] Fetch failed:', error);
        throw error;
      }
    })()
  );
});
