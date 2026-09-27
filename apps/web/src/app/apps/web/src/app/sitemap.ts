import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();

  return [
    {
      url: `${base}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/auth/sign-up`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/auth/sign-in`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];
}
