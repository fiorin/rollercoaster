const VERSION = "v2";
const CACHE_NAME = `rollercoaster-${VERSION}`;
const PRECACHE = ["/", "/index.html", "/manifest.json", "/icon.svg"];

/**
 * The service worker must never touch API traffic.
 *
 * The previous version ran `caches.match()` before `fetch()` for *every*
 * request, including the Supabase REST calls. That served stale weights from
 * the cache forever, and the offline fallback answered API calls with the
 * cached HTML shell — the app then tried to parse HTML as JSON.
 */
function isApiRequest(url) {
  return (
    url.pathname.startsWith("/rest/v1") ||
    url.pathname.startsWith("/auth/v1") ||
    url.pathname.startsWith("/rpc/") ||
    url.pathname.startsWith("/storage/v1")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE).catch(() => undefined)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Cross-origin (Supabase API, CDN) — stay out of the way.
  if (url.origin !== self.location.origin) return;
  if (isApiRequest(url)) return;

  // Navigations: network first so a new deploy is picked up immediately,
  // cached shell only as the offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put("/index.html", copy));
          }
          return response;
        })
        .catch(async () => {
          const cached =
            (await caches.match("/index.html")) || (await caches.match("/"));
          return (
            cached ||
            new Response("Offline", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            })
          );
        }),
    );
    return;
  }

  // Static assets: serve from cache, refresh in the background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const copy = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
