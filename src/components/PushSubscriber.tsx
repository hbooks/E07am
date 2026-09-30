import { useEffect } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { isPushSupported, subscribeToPush } from '@/lib/push';

/**
 * Invisible component. On app mount, if the user has push enabled in settings
 * and permission is already granted, silently re-subscribes (idempotent).
 * Handles: cleared browser data, PWA reinstall, service worker updates.
 */
export function PushSubscriber() {
    const { user, getToken, isAuthenticated } = useKindeAuth();

    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;
        if (!isPushSupported()) return;

        let enabled = false;
        try {
            const stored = localStorage.getItem('userSettings');
            if (stored) {
                const parsed = JSON.parse(stored);
                enabled = parsed.pushNotifications === true;
            }
        } catch { /* ignore */ }

        if (!enabled) return;
        if (Notification.permission !== 'granted') return;

        subscribeToPush(user.id, getToken).catch(() => { /* silent */ });
    }, [isAuthenticated, user?.id, getToken]);

    return null;
}