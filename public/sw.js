const CACHE_NAME = 'ctr-cache-v5';
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

    // Never touch crawler files (sitemap, robots, manifest). These must always
    // be served fresh from the network so Google Search Console can read them.
    if (
        url.pathname === '/sitemap.xml' ||
        url.pathname === '/robots.txt' ||
        url.pathname === '/manifest.json' ||
        url.pathname.endsWith('.xml') ||
        url.pathname.endsWith('.txt')
    ) {
        return;
    }

    // Never touch downloads (the APK is large) or range requests
    if (req.headers.has('range')) return;
    if (url.pathname.startsWith('/download/') || url.pathname.endsWith('.apk')) return;

    // Never touch the install page or help center. Otherwise the SW caches them
    // as the app shell ('/'), and users see the React SPA instead of the static page.
    if (
        url.pathname === '/install' || url.pathname.startsWith('/install/') ||
        url.pathname === '/help' || url.pathname.startsWith('/help/')
    ) return;

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

// ============================================================
// PUSH NOTIFICATIONS
// ============================================================

const DEFAULT_ICON = 'https://res.cloudinary.com/ctr-cloud/image/upload/v1790850806/tvpz7ushslf9cw9ivwlu.png';
const DEFAULT_BADGE = 'https://res.cloudinary.com/ctr-cloud/image/upload/v1790850805/mljpl4ynuscsoxqbnj0y.png';

// ---------- Push received ----------
self.addEventListener('push', (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (err) {
        console.warn('[SW] Push payload not JSON:', err);
        data = { title: 'Claim The Room', body: event.data?.text() || 'New activity' };
    }

    const title = data.title || 'Claim The Room';
    const options = {
        body: data.body || 'You have a new notification',
        icon: data.icon || DEFAULT_ICON,
        badge: data.badge || DEFAULT_BADGE,
        tag: data.tag || 'ctr-notification',
        data: {
            url: data.url || '/',
        },
        requireInteraction: false,
        silent: false,
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// ---------- Notification clicked ----------
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If a CTR tab is already open, focus it and navigate
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    if ('navigate' in client) {
                        client.navigate(urlToOpen).catch(() => { });
                    }
                    return client.focus();
                }
            }
            // Otherwise open a new window
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});