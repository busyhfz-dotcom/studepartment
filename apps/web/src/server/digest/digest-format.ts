export const DIGEST_WINDOW_DAYS = 7;
/** Saved-opportunity deadlines are looked up at most this far ahead. */
export const MAX_DEADLINE_LOOKAHEAD_DAYS = 90;

/** Listing text comes from external sources, so it is escaped before it is placed in HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** The scheduled job checks daily, so use the lead time the researcher chose. */
export function isDeadlineDue(deadline: Date, alertLeadDays: number, now: Date): boolean {
  const lead = Math.min(MAX_DEADLINE_LOOKAHEAD_DAYS, Math.max(alertLeadDays, 1));
  return deadline.getTime() >= now.getTime() && deadline.getTime() <= now.getTime() + lead * 86_400_000;
}
