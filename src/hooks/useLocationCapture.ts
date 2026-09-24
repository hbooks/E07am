// src/hooks/useLocationCapture.ts
import { useEffect, useState } from 'react';

const CACHE_KEY = 'cusel';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

export interface UserLocation {
    country: string | null;
    country_code: string | null;
    city: string | null;
    region: string | null;
}

const EMPTY_LOCATION: UserLocation = {
    country: null,
    country_code: null,
    city: null,
    region: null,
};

function readCache(): UserLocation | null {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.timestamp || Date.now() - parsed.timestamp > CACHE_TTL) {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }
        return parsed.data ?? null;
    } catch {
        return null;
    }
}

function writeCache(data: UserLocation) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch { /* ignore */ }
}

/**
 * Fetches the user's approximate location once per 24h via ipwho.is.
 * Never throws, never blocks UI. Returns null until resolved.
 */
export function useLocationCapture(): UserLocation | null {
    const [location, setLocation] = useState<UserLocation | null>(() => readCache());

    useEffect(() => {
        if (location) return; // already cached

        let cancelled = false;

        (async () => {
            try {
                const res = await fetch('https://ipwho.is/');
                if (!res.ok) return;
                const data = await res.json();
                if (!data?.success) return;

                const loc: UserLocation = {
                    country: data.country ?? null,
                    country_code: data.country_code ?? null,
                    city: data.city ?? null,
                    region: data.region ?? null,
                };
                if (!cancelled) {
                    setLocation(loc);
                    writeCache(loc);
                }
            } catch {
                // silent — location is best-effort
            }
        })();

        return () => { cancelled = true; };
    }, [location]);

    return location;
}

/** Non-hook helper — safe to call from anywhere (returns empty if not cached yet) */
export function getCachedLocation(): UserLocation {
    return readCache() ?? EMPTY_LOCATION;
}