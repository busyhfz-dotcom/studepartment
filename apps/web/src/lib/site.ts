const FALLBACK_SITE_URL = "http://localhost:3000";

/**
 * Canonical public base URL for the app, used for metadata (Open Graph,
 * canonical links, sitemap, robots) and anywhere else an absolute URL is
 * required outside of a request context.
 *
 * Reuses BETTER_AUTH_URL rather than introducing a second "which URL is
 * this deployment on" environment variable — Better Auth already requires
 * this to be set correctly per-environment for OAuth callbacks to work.
 */
export function getSiteUrl(): string {
  const configured = process.env.BETTER_AUTH_URL?.trim();
  return configured && configured.length > 0 ? configured.replace(/\/+$/, "") : FALLBACK_SITE_URL;
}

export const siteName = "Provenant";
export const siteTagline = "Medical Research Intelligence";
export const siteDescription =
  "Provenant helps medical researchers find positions, funding and collaborators, with the source and date behind every listing.";
