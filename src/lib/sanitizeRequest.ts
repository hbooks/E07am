export const REQUEST_REASON_MIN = 5;
export const REQUEST_REASON_MAX = 1000;

/**
 * Sanitize support/abuse request text before storing or displaying.
 * This is normalization + defense-in-depth — not a replacement for
 * output escaping (React does that) or server-side validation.
 */
export function sanitizeRequestReason(
    input: string,
    maxLength = REQUEST_REASON_MAX,
): string {
    if (!input) return '';

    let out = input;

    // 1. Unicode normalize (prevents look-alike char tricks)
    out = out.normalize('NFC');

    // 2. Strip zero-width & bidi control chars (used to hide payloads)
    out = out.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '');

    // 3. Strip C0/C1 control chars except \n and \t
    out = out.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');

    // 4. Strip HTML tags (defense-in-depth for non-React renderers)
    out = out.replace(/<\/?[^>]+(>|$)/g, '');

    // 5. Collapse excessive whitespace
    out = out.replace(/\n{3,}/g, '\n\n').replace(/[ \t]{3,}/g, ' ');

    // 6. Trim + clamp
    return out.trim().slice(0, maxLength);
}

/**
 * Strip control chars *as the user types* — keeps newlines/tabs.
 * Use this in the textarea's onChange so bad chars never enter state.
 */
export function stripControlChars(input: string, maxLength = REQUEST_REASON_MAX): string {
    return input
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .slice(0, maxLength);
}

/**
 * Optional PII scrubber — only if you explicitly don't want
 * emails/phones/links stored (e.g. public moderation queues).
 */
export function redactPII(input: string): string {
    return input
        .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email redacted]')
        .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, '[phone redacted]')
        .replace(/https?:\/\/\S+/gi, '[link redacted]');
}

/**
 * Client-side validation that mirrors server rules.
 * Never trust this alone — the Edge Function re-checks.
 */
export function validateRequestReason(
    raw: string,
): { ok: true; value: string } | { ok: false; error: string } {
    const clean = sanitizeRequestReason(raw, REQUEST_REASON_MAX);
    if (clean.length < REQUEST_REASON_MIN) {
        return {
            ok: false,
            error: `Please provide at least ${REQUEST_REASON_MIN} characters.`,
        };
    }
    return { ok: true, value: clean };
}