/** Accept both standard Retry-After and Better Auth's x-retry-after header. */
export function retryAfterSeconds(headers: Pick<Headers, "get">, now = Date.now(), fallback = 60): number {
  const value = headers.get("retry-after") ?? headers.get("x-retry-after");
  if (!value?.trim()) return fallback;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, Math.ceil((date - now) / 1000)) : fallback;
}
