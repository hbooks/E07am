const BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

export function isPushSupported(): boolean {
    return (
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
    );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    // Explicitly allocate an ArrayBuffer so the type is Uint8Array<ArrayBuffer>
    // (not Uint8Array<ArrayBufferLike>), which satisfies PushSubscriptionOptionsInit.
    const buffer = new ArrayBuffer(rawData.length);
    const output = new Uint8Array(buffer);
    for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
    return output;
}

/**
 * Register service worker, request permission (if needed), subscribe to push,
 * and save the subscription to Supabase. Idempotent — safe to call repeatedly.
 */
export async function subscribeToPush(
    userId: string,
    getToken: () => Promise<string | null>,
): Promise<boolean> {
    if (!isPushSupported()) {
        console.warn('[Push] Not supported in this browser');
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        if (Notification.permission === 'denied') {
            console.warn('[Push] Permission denied by user');
            return false;
        }
        if (Notification.permission === 'default') {
            const perm = await Notification.requestPermission();
            if (perm !== 'granted') {
                console.warn('[Push] Permission not granted');
                return false;
            }
        }

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
            });
        }

        const token = await getToken();
        if (!token) {
            console.warn('[Push] No auth token');
            return false;
        }

        const res = await fetch(`${BASE_URL}/PushSub`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                action: 'save',
                userId,
                subscription: subscription.toJSON(),
            }),
        });

        if (!res.ok) {
            console.warn('[Push] Save subscription failed:', res.status);
            return false;
        }

        console.log('[Push] Subscribed successfully');
        return true;
    } catch (err) {
        console.error('[Push] Subscribe error:', err);
        return false;
    }
}

/**
 * Unsubscribe from push and remove the subscription from Supabase.
 */
export async function unsubscribeFromPush(
    userId: string,
    getToken: () => Promise<string | null>,
): Promise<boolean> {
    if (!isPushSupported()) return false;

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();
        }

        const token = await getToken();
        if (!token) return false;

        await fetch(`${BASE_URL}/PushSub`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ action: 'delete', userId }),
        });

        console.log('[Push] Unsubscribed');
        return true;
    } catch (err) {
        console.error('[Push] Unsubscribe error:', err);
        return false;
    }
}