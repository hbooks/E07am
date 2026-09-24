import { supabase } from '@/lib/supabaseClient';
import { getCachedLocation } from '@/hooks/useLocationCapture';

const SESSION_KEY = 'ctr_session_id';

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

export function trackPageView(path: string, userId?: string | null) {
    const ua = navigator.userAgent;
    const { browser, os, deviceType } = parseUserAgent(ua);
    const loc = getCachedLocation();

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
        // Location — null until ipwho.is resolves (first ~1s of a fresh session)
        country: loc.country,
        country_code: loc.country_code,
        city: loc.city,
        region: loc.region,
    };

    supabase.from('analytics_events').insert(payload).then(
        () => { },
        () => { } // silently fail
    );
}

export function trackError(message: string, stack?: string, userId?: string | null) {
    const ua = navigator.userAgent;
    const { browser, os, deviceType } = parseUserAgent(ua);
    const loc = getCachedLocation();

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
        // Location
        country: loc.country,
        country_code: loc.country_code,
        city: loc.city,
        region: loc.region,
    };

    supabase.from('analytics_events').insert(payload).then(
        () => { },
        () => { }
    );
}