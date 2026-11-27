// Voyelis service worker: makes the site installable and usable offline for pages already visited.
// - /api/* and non-GET requests always go to the network (prices are never cached).
// - Built assets (/_astro/*), fonts and images: cache first.
// - Pages: network first, falling back to the cached copy, then to /offline.html.
const VERSION = 'v1';
const STATIC = `voyelis-static-${VERSION}`;
const PAGES = `voyelis-pages-${VERSION}`;
const PRECACHE = ['/offline.html', '/favicon.ico', '/icon-192.png', '/brand/mark-160.png', '/site.webmanifest'];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(STATIC).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((k) => k.startsWith('voyelis-') && ![STATIC, PAGES].includes(k)).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    if (res.ok) {
                        const copy = res.clone();
                        caches.open(PAGES).then((c) => c.put(req, copy));
                    }
                    return res;
                })
                .catch(async () => (await caches.match(req)) || (await caches.match('/offline.html')))
        );
        return;
    }

    if (/^\/(_astro|brand)\//.test(url.pathname) || /\.(png|svg|ico|webp|woff2?)$/.test(url.pathname)) {
        event.respondWith(
            caches.match(req).then(
                (hit) =>
                    hit ||
                    fetch(req).then((res) => {
                        if (res.ok) {
                            const copy = res.clone();
                            caches.open(STATIC).then((c) => c.put(req, copy));
                        }
                        return res;
                    })
            )
        );
    }
});
