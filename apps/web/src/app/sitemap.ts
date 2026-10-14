import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

// Rendered per request so URLs use the runtime BETTER_AUTH_URL, not the
// placeholder the Docker build stage sets.
export const dynamic = "force-dynamic";

const publicPages: Array<{ path: string; changeFrequency: "daily" | "weekly" | "monthly"; priority: number }> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/main-site", changeFrequency: "weekly", priority: 0.9 },
  { path: "/start", changeFrequency: "weekly", priority: 0.8 },
  { path: "/opportunities", changeFrequency: "daily", priority: 0.8 },
  { path: "/scanner", changeFrequency: "monthly", priority: 0.7 },
  { path: "/conferences", changeFrequency: "monthly", priority: 0.6 },
  { path: "/auth/sign-up", changeFrequency: "monthly", priority: 0.5 },
  { path: "/auth/sign-in", changeFrequency: "monthly", priority: 0.4 },
  { path: "/terms", changeFrequency: "monthly", priority: 0.2 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  return publicPages.map(({ path, changeFrequency, priority }) => ({
    url: path === "/" ? `${base}/` : `${base}${path}`,
    changeFrequency,
    priority,
  }));
}
