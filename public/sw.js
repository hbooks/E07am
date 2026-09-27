const CACHE_NAME = 'ctr-cache-v2';
const CACHE_PREFIX = 'ctr-cache-';   // used to identify our caches for cleanup

const PRECACHE = [
    '/manifest.json',
    '/assets/favicon/favicon.ico',
    '/assets/favicon/favicon.svg',
    '/assets/favicon/apple-touch-icon.png',
];

// ---------- Install ----------
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) =>
            Promise.allSettled(
                PRECACHE.map((url) =>
                    cache.add(url).catch((err) => {
                        console.warn('[SW] Precaching failed for', url, err);
                    })
                )
            )
        )
    );
    self.skipWaiting();
});

// ---------- Activate ----------
self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const cacheNames = await caches.keys();
            await Promise.allSettled(
                cacheNames.map((name) => {
                    // Delete any of our caches that aren't the current one
                    if (name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
            await self.clients.claim();
        })()
    );
});

// ---------- Fetch ----------
self.addEventListener('fetch', (event) => {
    const req = event.request;

    // Only handle GETs
    if (req.method !== 'GET') return;

    const url = new URL(req.url);

    // Never touch cross-origin (Cloudinary, Supabase, Kinde, etc.)
    if (url.origin !== self.location.origin) return;

    // Never touch API / edge functions
    if (url.pathname.startsWith('/functions/')) return;

    // ---- 1. Navigation (SPA routes) → NETWORK FIRST ----
    if (req.mode === 'navigate') {
        event.respondWith(
            (async () => {
                try {
                    const fresh = await fetch(req);
                    // Store fresh HTML for offline fallback
                    const cache = await caches.open(CACHE_NAME);
                    cache.put('/', fresh.clone());
                    return fresh;
                } catch {
                    // Offline — serve last cached shell or fail gracefully
                    const cached = await caches.match('/');
                    if (cached) return cached;
                    return new Response(
                        '<!doctype html><meta charset="utf-8"><title>Offline</title><body style="background:#08090b;color:#fff;font-family:sans-serif;text-align:center;padding:4rem 1rem"><h1>You\'re offline</h1><p>Reconnect to continue using Claim The Room.</p></body>',
                        { status: 503, headers: { 'Content-Type': 'text/html' } }
                    );
                }
            })()
        );
        return;
    }

    // ---- 2. Hashed assets → CACHE FIRST ----
    if (url.pathname.startsWith('/assets/')) {
        event.respondWith(
            (async () => {
                const cached = await caches.match(req);
                if (cached) return cached;

                try {
                    const fresh = await fetch(req);
                    if (fresh.ok) {
                        const cache = await caches.open(CACHE_NAME);
                        cache.put(req, fresh.clone());
                    }
                    return fresh;
                } catch {
                    // Not cached and offline — return 504
                    return new Response('', { status: 504 });
                }
            })()
        );
        return;
    }

    // ---- 3. Explicit index.html requests → NETWORK FIRST ----
    if (url.pathname === '/index.html') {
        event.respondWith(
            fetch(req).catch(() => caches.match('/'))
        );
        return;
    }

    // ---- 4. Everything else → network only ----
});