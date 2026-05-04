const CACHE_NAME = "rjg-v4";

// Static assets to cache on install
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/public/landing.html",
  "/public/landing.css",
  "/public/offline.html",
  "/public/about-us.html",
  "/public/about-us.css",
  "/public/terms-con.html",
  "/public/terms-con.css",
  "/auth/log-sign.html",
  "/auth/log-sign.css",
  "/auth/forgot-password.html",
  "/auth/forgot-password.css",
  "/auth/reset-password.html",
  "/auth/reset-password.css",
  "/assets/images/Logo_RJG.png",
  "/assets/images/Background.jpg",
  "/manifest.json"
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept Supabase API calls or external requests
  if (!url.origin.includes(self.location.origin)) return;

  // Network-first for HTML pages (always get fresh content when online)
  if (request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the fresh page
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          // Offline: try cache, fall back to offline page
          caches.match(request).then(
            (cached) => cached || caches.match("/public/offline.html")
          )
        )
    );
    return;
  }

  // Cache-first for static assets (CSS, JS, images, fonts)
  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }
});
