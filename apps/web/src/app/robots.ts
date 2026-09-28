import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

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
          "/opportunities",
          "/introductions",
          "/graph",
          "/assistant",
          "/profile",
          "/settings",
          "/institutions",
          "/researchers",
          "/scanner",
          "/conferences",
          "/organization",
        ],
      },
    ],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
