// Public application shell only. Never intercept cross-origin, authenticated API or private evidence.
const CACHE = "piga-aiact-shell-v18-full-article-guides";
const SHELL = [
  "./", "./index.html", "./styles.css", "./design-v3.css", "./app.bundle.js",
  "./engine.js", "./portfolio.js", "./publications.js", "./journey.js",
  "./piga-act-bridge.js", "./welcome-journey.mjs", "./article-piga-guides.mjs", "./article-piga-ui.mjs", "./icon.svg", "./manifest.webmanifest",
  "./privacy.html", "./terms.html"
];
const shellURLs = new Set(SHELL.map(path => new URL(path, self.registration.scope).href));
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL.map(path => new Request(path, {cache:"reload"})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(key => key.startsWith("piga-aiact-shell-") && key !== CACHE)
      .map(key => caches.delete(key)))
  ).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || request.headers.has("authorization")) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !shellURLs.has(url.href)) return;
  if (request.mode === "navigate") {
    // Network first: show current legal notices; offline only for an explicitly cached public page.
    event.respondWith(fetch(request).catch(async () => {
      const cached = await caches.match(request, {ignoreSearch: true});
      if (cached) return cached;
      return Response.error();
    }));
    return;
  }
  event.respondWith(caches.match(request, {ignoreSearch: true}).then(cached => cached || fetch(request)));
});
