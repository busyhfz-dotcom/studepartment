import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

function contentSecurityPolicy(nonce: string) {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isProduction =
    process.env.DEPLOYMENT_ENV === "production"
    || (process.env.NODE_ENV === "production" && process.env.DEPLOYMENT_ENV !== "ci");

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'${isDevelopment ? " 'unsafe-inline'" : ""}`,
    "style-src-attr 'unsafe-inline'",
    // Profile photos and logos are uploaded and served from this origin. Remote images
    // would let a profile owner log the IP address of everyone who views the profile.
    "img-src 'self' blob: data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "manifest-src 'self'",
    "media-src 'self'",
    "worker-src 'self' blob:",
    isProduction ? "upgrade-insecure-requests" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function siteOrigin(request: NextRequest) {
  try {
    return new URL(process.env.BETTER_AUTH_URL ?? "").origin;
  } catch {
    // No configured public URL (local tooling): fall back to the host this request was sent to.
    return `${request.nextUrl.protocol}//${request.headers.get("host") ?? request.nextUrl.host}`;
  }
}

/**
 * Session cookies authenticate /api/v1, so a state-changing request must come
 * from this site's own pages. Browsers always send Origin on cross-origin
 * writes; the few that omit it still send Sec-Fetch-Site. A client that sends
 * neither is not a browser and cannot be carrying a victim's session.
 */
function isCrossSiteMutation(request: NextRequest) {
  if (!UNSAFE_METHODS.has(request.method)) return false;
  const origin = request.headers.get("origin");
  if (origin) return origin !== siteOrigin(request);
  const fetchSite = request.headers.get("sec-fetch-site");
  return Boolean(fetchSite) && fetchSite !== "same-origin" && fetchSite !== "none";
}

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (isCrossSiteMutation(request)) {
      return NextResponse.json(
        { success: false, error: { code: "CROSS_SITE_REQUEST", message: "Send this request from Provenant." } },
        { status: 403, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    return NextResponse.next();
  }

  const nonce = Buffer.from(randomUUID()).toString("base64");
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Cookie-authenticated API: cross-site write protection only (no CSP needed for JSON).
    { source: "/api/v1/:path*" },
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
