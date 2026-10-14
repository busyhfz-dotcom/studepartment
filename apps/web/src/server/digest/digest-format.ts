export const DIGEST_WINDOW_DAYS = 7;
/** Saved-opportunity deadlines are looked up at most this far ahead. */
export const MAX_DEADLINE_LOOKAHEAD_DAYS = 30;

/** Listing text comes from external sources, so it is escaped before it is placed in HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * The weekly cadence means a reminder must cover the user's lead time plus the
 * week until the next digest, otherwise a 7-day reminder could be skipped.
 */
export function isDeadlineDue(deadline: Date, alertLeadDays: number, now: Date): boolean {
  const lead = Math.min(MAX_DEADLINE_LOOKAHEAD_DAYS, Math.max(alertLeadDays, DIGEST_WINDOW_DAYS));
  return deadline.getTime() >= now.getTime() && deadline.getTime() <= now.getTime() + lead * 86_400_000;
}
