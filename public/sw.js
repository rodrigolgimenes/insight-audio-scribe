
// Cache version and name
const CACHE_VERSION = 'v1';
const CACHE_NAME = `lovable-cache-${CACHE_VERSION}`;

const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/favicon.ico',
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('[Service Worker] Caching static resources');
        await cache.addAll(STATIC_RESOURCES);
        await self.skipWaiting(); // Activate new service worker immediately
      } catch (error) {
        console.error('[Service Worker] Cache installation failed:', error);
        // Continue without caching if it fails
      }
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        await self.clients.claim(); // Take control of all clients
        
        // Delete old caches
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        );
      } catch (error) {
        console.error('[Service Worker] Activation error:', error);
      }
    })()
  );
});

// Fetch event - serve from cache, falling back to network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests to avoid errors
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Try cache first
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Fall back to network
        const response = await fetch(event.request);
        
        // Don't cache failed responses
        if (!response || response.status !== 200) {
          return response;
        }

        try {
          // Clone the response before caching it
          const responseToCache = response.clone();
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, responseToCache);
        } catch (cacheError) {
          console.error('[Service Worker] Cache write error:', cacheError);
          // Continue even if caching fails
        }
        
        return response;
      } catch (error) {
        console.error('[Service Worker] Fetch failed:', error);
        
        // Try to return something from cache as a fallback for offline support
        const cachedFallback = await caches.match('/');
        if (cachedFallback) {
          return cachedFallback;
        }
        
        // If all else fails, return a basic response
        return new Response('Network request failed and no cache available', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
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
