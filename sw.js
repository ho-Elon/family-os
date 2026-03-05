// Service Worker for Leng Family OS
const CACHE_NAME = 'family-os-v1.7';
const STATIC_ASSETS = ['/', '/index.html'];

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  // Network-first for API calls and external resources
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('supabase') ||
      event.request.url.includes('open-meteo') ||
      event.request.url.includes('nominatim')) {
    return;
  }
  
  // Cache-first for static assets (CDN libs)
  if (event.request.url.includes('cdn.jsdelivr.net')) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        if (cached) return cached;
        return fetch(event.request).then(function(response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
          return response;
        });
      })
    );
    return;
  }
});
