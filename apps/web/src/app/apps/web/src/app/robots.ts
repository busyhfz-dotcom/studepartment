import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Authenticated workspace surfaces have no useful content for a crawler
        // and would otherwise index empty/redirecting shells.
        disallow: [
          "/api/",
          "/onboarding",
          "/discover",
          "/opportunities",
          "/introductions",
          "/graph",
          "/assistant",
          "/profile",
          "/settings",
          "/institutions",
          "/researchers",
        ],
      },
    ],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
