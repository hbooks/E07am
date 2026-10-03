import { supabase } from '@/lib/supabaseClient';
import { getCachedLocation, type UserLocation } from '@/hooks/useLocationCapture';

const SESSION_KEY = 'ctr_session_id';
const LOCATION_WAIT_MS = 2500;
const LOCATION_POLL_MS = 150;
const ADMIN_ID = import.meta.env.VITE_ADID as string | undefined;

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
                resolve(loc);
            }
        }, LOCATION_POLL_MS);
    });
}

// Admin exclusion — any event where userId matches VITE_ADID is dropped
function isAdmin(userId?: string | null): boolean {
    if (!ADMIN_ID) return false;
    return userId === ADMIN_ID;
}

interface EventPayload {
    event_type: 'page_view' | 'error' | 'signed_in' | 'onboarding_complete' | 'first_action';
    page_path: string;
    user_id: string | null;
    session_id: string;
    user_agent: string;
    browser: string;
    os: string;
    device_type: string;
    screen_width: number;
    screen_height: number;
    referrer: string | null;
    error_message?: string | null;
    error_stack?: string | null;
    country: string | null;
    country_code: string | null;
    city: string | null;
    region: string | null;
    latitude: number | null;
    longitude: number | null;
}

async function writeEvent(
    eventType: EventPayload['event_type'],
    userId: string | null | undefined,
    extra: Partial<EventPayload> = {},
) {
    if (isAdmin(userId)) return;

    const ua = navigator.userAgent;
    const { browser, os, deviceType } = parseUserAgent(ua);
    const loc = await waitForLocation();

    const payload: EventPayload = {
        event_type: eventType,
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
        // Use ?? null so undefined never reaches the DB. Supabase silently
        // rejects payloads with undefined fields.
        country: loc.country ?? null,
        country_code: loc.country_code ?? null,
        city: loc.city ?? null,
        region: loc.region ?? null,
        latitude: loc.latitude ?? null,
        longitude: loc.longitude ?? null,
        ...extra,
    };

    supabase.from('analytics_events').insert(payload).then(
        () => { },
        (err) => {
            console.error('[analytics] insert failed:', eventType, err);
        },
    );
}

export function trackPageView(path: string, userId?: string | null) {
    void writeEvent('page_view', userId, { page_path: path });
}

export function trackError(message: string, stack?: string, userId?: string | null) {
    void writeEvent('error', userId, {
        error_message: message,
        error_stack: stack || null,
    });
}

export function trackSignedIn(userId: string) {
    void writeEvent('signed_in', userId);
}

export function trackOnboardingComplete(userId: string) {
    void writeEvent('onboarding_complete', userId);
}

export function trackFirstAction(userId: string, detail: string) {
    void writeEvent('first_action', userId, { page_path: detail });
}