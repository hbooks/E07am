import { useEffect, useState } from 'react';
import MaintenancePage from '@/pages/MaintenancePage';
import { supabase } from '@/lib/supabaseClient';

const BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

interface MaintenanceStatus {
    enabled: boolean;
    message: string | null;
    bypass: boolean;
}

export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<MaintenanceStatus | null>(null);

    // One-time: initial state + the bypass-key check (the key doesn't change
    // without a fresh page load, so this never needs to repeat).
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const key = new URLSearchParams(window.location.search).get('key') || '';
                const res = await fetch(
                    `${BASE_URL}/Get_Maintenance${key ? `?key=${encodeURIComponent(key)}` : ''}`,
                );
                const data = await res.json();
                if (!cancelled) setStatus(data);
            } catch {
                // Leave status as-is on a network hiccup rather than blocking on it.
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // Live: Supabase Realtime pushes the row the instant Set_Maintenance
    // updates it — this is what makes it instant instead of polled.
    useEffect(() => {
        const channel = supabase
            .channel('app_state-maintenance')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'app_state', filter: 'key=eq.maintenance' },
                (payload) => {
                    const row = payload.new as { value?: { enabled?: boolean; message?: string | null } } | undefined;
                    if (!row?.value) return;
                    setStatus((prev) => ({
                        enabled: !!row.value!.enabled,
                        message: row.value!.message ?? null,
                        bypass: prev?.bypass ?? false,
                    }));
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // First check hasn't resolved yet — hold a blank frame matching the app's
    // background rather than flashing real content that then gets yanked away.
    if (status === null) {
        return <div className="min-h-screen bg-background" />;
    }

    if (status.enabled && !status.bypass) {
        return <MaintenancePage message={status.message} />;
    }

    return <>{children}</>;
}