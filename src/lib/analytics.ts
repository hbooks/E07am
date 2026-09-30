import { supabase } from '@/lib/supabaseClient';
import { getCachedLocation, type UserLocation } from '@/hooks/useLocationCapture';

const SESSION_KEY = 'ctr_session_id';
const LOCATION_WAIT_MS = 2500;
const LOCATION_POLL_MS = 150;

function getSessionId(): string {
    let sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
}

function parseUserAgent(ua: string) {
    const browser = ua.includes('Firefox') ? 'Firefox'
        : ua.includes('Edg') ? 'Edge'
            : ua.includes('Chrome') ? 'Chrome'
                : ua.includes('Safari') ? 'Safari'
                    : 'Other';

    const os = ua.includes('Windows') ? 'Windows'
        : ua.includes('Mac') ? 'macOS'
            : ua.includes('Android') ? 'Android'
                : ua.includes('iPhone') || ua.includes('iPad') ? 'iOS'
                    : ua.includes('Linux') ? 'Linux'
                        : 'Other';

    const deviceType = /Mobi|Android/i.test(ua) ? 'mobile'
        : /Tablet|iPad/i.test(ua) ? 'tablet'
            : 'desktop';

    return { browser, os, deviceType };
}

/**
 * Resolves with a location that has coordinates, or falls back to whatever
 * is cached after a short wait. First event of a fresh session waits for
 * ipwho.is to resolve (~1s). Every subsequent event gets the cached value
 * immediately (no delay).
 */
function waitForLocation(timeoutMs = LOCATION_WAIT_MS): Promise<UserLocation> {
    const existing = getCachedLocation();
    if (existing.latitude !== null) return Promise.resolve(existing);

    const start = Date.now();
    return new Promise((resolve) => {
        const interval = window.setInterval(() => {
            const loc = getCachedLocation();
            if (loc.latitude !== null) {
                window.clearInterval(interval);
                resolve(loc);
            } else if (Date.now() - start > timeoutMs) {
                window.clearInterval(interval);
                resolve(loc); // give up, return whatever we have
            }
        }, LOCATION_POLL_MS);
    });
}

export function trackPageView(path: string, userId?: string | null) {
    const ua = navigator.userAgent;
    const { browser, os, deviceType } = parseUserAgent(ua);

    void (async () => {
        const loc = await waitForLocation();

        const payload = {
            event_type: 'page_view',
            page_path: path,
            user_id: userId || null,
            session_id: getSessionId(),
            user_agent: ua,
            browser,
            os,
            device_type: deviceType,
            screen_width: window.screen.width,
            screen_height: window.screen.height,
            referrer: document.referrer || null,
            country: loc.country,
            country_code: loc.country_code,
            city: loc.city,
            region: loc.region,
            latitude: loc.latitude,
            longitude: loc.longitude,
        };

        supabase.from('analytics_events').insert(payload).then(
            () => { },
            () => { } // silently fail
        );
    })();
}

export function trackError(message: string, stack?: string, userId?: string | null) {
    const ua = navigator.userAgent;
    const { browser, os, deviceType } = parseUserAgent(ua);

    void (async () => {
        const loc = await waitForLocation();

        const payload = {
            event_type: 'error',
            page_path: window.location.pathname,
            user_id: userId || null,
            session_id: getSessionId(),
            user_agent: ua,
            browser,
            os,
            device_type: deviceType,
            screen_width: window.screen.width,
            screen_height: window.screen.height,
            referrer: document.referrer || null,
            error_message: message,
            error_stack: stack || null,
            country: loc.country,
            country_code: loc.country_code,
            city: loc.city,
            region: loc.region,
            latitude: loc.latitude,
            longitude: loc.longitude,
        };

        supabase.from('analytics_events').insert(payload).then(
            () => { },
            () => { }
        );
    })();
}