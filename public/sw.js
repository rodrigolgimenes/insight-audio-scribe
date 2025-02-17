
const CACHE_VERSION = 'v1';
const CACHE_NAME = `lovable-cache-${CACHE_VERSION}`;

const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/favicon.ico',
];

// Cache manager
const cacheManager = new Worker('/cache-worker.js');
cacheManager.onmessage = (event) => {
  console.log('[Service Worker] Cache cleanup status:', event.data);
};

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('[Service Worker] Caching static resources');
      await cache.addAll(STATIC_RESOURCES);
      await self.skipWaiting(); // Activate new service worker immediately
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim(); // Take control of all clients
      cacheManager.postMessage({ 
        type: 'CLEAN_OLD_CACHES', 
        cacheVersion: CACHE_NAME 
      });
    })()
  );
});

// Fetch event - serve from cache, falling back to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      // Try to get the response from cache
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const response = await fetch(event.request);
        
        // Don't cache non-GET requests or failed responses
        if (!event.request.method === 'GET' || !response || response.status !== 200) {
          return response;
        }

        // Clone the response before caching it
        const responseToCache = response.clone();
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, responseToCache);
        
        return response;
      } catch (error) {
        console.error('[Service Worker] Fetch failed:', error);
        throw error;
      }
    })()
  );
});

// Handle service worker updates
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
