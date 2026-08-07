/**
 * Input sanitization helpers.
 *
 * NOTE: In production these would be re-validated server-side (zod schemas,
 * length limits, trimming). Client-side sanitization is a UX layer only.
 */

/** Room numbers: uppercase alphanumeric only, max 8 chars (eFootball room IDs). */
export function sanitizeRoomNumber(input: string): string {
  return input.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
}

/** Room passwords: strip whitespace and control chars, max 16 chars. */
export function sanitizePassword(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\s\x00-\x1F]/g, "").slice(0, 16);
}

/** Community post text: trim, collapse runs of whitespace, cap at 280 chars. */
export function sanitizePostText(input: string): string {
  return input.replace(/\s+/g, " ").trim().slice(0, 280);
}

/** Search query: strip anything except letters, numbers, underscore, dot, @. */
export function sanitizeSearchQuery(input: string): string {
  return input.replace(/[^\w.@]/g, "").slice(0, 40);
}
