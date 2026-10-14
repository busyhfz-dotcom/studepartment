/** Keep a user-requested destination within this application. */
export function safeReturnPath(value: string | undefined | null, fallback = "/profile") {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const url = new URL(value, "https://provenant.invalid");
    return url.origin === "https://provenant.invalid" ? url.pathname + url.search + url.hash : fallback;
  } catch { return fallback; }
}
