const CACHE_NAME = "multiplication-quiz-v1"; // Cache version
const urlsToCache = [
  "./", // Caches the root (index.html)
  "./index.html",
  "./style.css",
  "./script.js",
  "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap", // Google Fonts CSS
  // Add your icon paths here
  "./icons/android-chrome-192x192.png",
  "./icons/android-chrome-512x512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-16x16.png",
  "./icons/favicon-32x32.png",
  "./icons/favicon.ico",

];

// Install event: Caches all the necessary assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event: Intercepts network requests
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      // No cache hit - fetch from network
      return fetch(event.request).catch(() => {
        // If network also fails, you could return an offline page here
        // For this simple app, we just let the fetch error propagate.
        // For a more robust app, you'd show a custom offline page if the request is for an HTML page.
        // E.g., if (event.request.mode === 'navigate') { return caches.match('./offline.html'); }
      });
    })
  );
});

// Activate event: Clean up old caches
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Delete old caches
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
