export interface NotificationMessage {
    title: string;
    detail: string;
    kind: 'match' | 'claim' | 'admin' | 'follow';
}

export const MESSAGE_MAP: Record<string, NotificationMessage> = {
    MATCH_CLAIMED_HOST: {
        title: 'Match claimed',
        detail: 'Your 1v1 match request has been claimed. The other player is likely joining your room now.',
        kind: 'match',
    },
    MATCH_CLAIMED_HOST_MULTI: {
        title: 'Player joined',
        detail: 'Someone joined your Co‑op room. Waiting for more players…',
        kind: 'match',
    },
    MATCH_CLAIMED_YOU: {
        title: 'Room claimed',
        detail: 'You successfully claimed a match. The host has been notified.',
        kind: 'claim',
    },
    MATCH_EXPIRED_HOST: {
        title: 'Match expired',
        detail: 'Your match request expired without enough players. You are free to create a new one.',
        kind: 'match',
    },
    MATCH_EXPIRED_CLAIMANT: {
        title: 'Match expired',
        detail: 'A match you joined expired before filling up. You are free to claim other rooms.',
        kind: 'match',
    },
};