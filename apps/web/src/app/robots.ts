import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

// Rendered per request so the sitemap URL uses the runtime BETTER_AUTH_URL,
// not the placeholder the Docker build stage sets.
export const dynamic = "force-dynamic";

/**
 * Public, non-personal pages (landing, start, Scanner, Conferences, legal) stay
 * crawlable. Researcher discovery, profiles and every signed-in workspace stay
 * out of search engines because they surface people, not listings.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/onboarding",
          "/discover",
          "/opportunities/saved",
          "/introductions",
          "/graph",
          "/assistant",
          "/profile",
          "/settings",
          "/files",
          "/billing",
          "/institutions",
          "/researchers",
          "/organization",
        ],
      },
    ],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
