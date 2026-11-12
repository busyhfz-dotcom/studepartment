import type { MetadataRoute } from "next";
import { getDb } from "@studepartment/db";
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
  { path: "/sources", changeFrequency: "daily", priority: 0.5 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/auth/sign-up", changeFrequency: "monthly", priority: 0.5 },
  { path: "/auth/sign-in", changeFrequency: "monthly", priority: 0.4 },
  { path: "/terms", changeFrequency: "monthly", priority: 0.2 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.2 },
];

// A single sitemap file may hold 50,000 URLs; stay well inside that.
const MAX_LISTINGS = 20_000;

/** Every open listing has its own public page, so each one is offered to search engines. */
async function listingEntries(base: string): Promise<MetadataRoute.Sitemap> {
  try {
    const now = new Date();
    const rows = await getDb().opportunity.findMany({
      where: {
        status: "ACTIVE",
        lastSeenAt: { gte: new Date(now.getTime() - 45 * 86_400_000) },
        OR: [{ deadline: null }, { deadline: { gte: now } }],
      },
      orderBy: { firstSeenAt: "desc" },
      take: MAX_LISTINGS,
      select: { id: true, updatedAt: true },
    });
    return rows.map((row) => ({
      url: `${base}/opportunities/${row.id}`,
      lastModified: row.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch (error) {
    // The static pages must stay discoverable even if the database is unreachable.
    console.error("Sitemap listings unavailable", error instanceof Error ? error.name : "UnknownError");
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const pages: MetadataRoute.Sitemap = publicPages.map(({ path, changeFrequency, priority }) => ({
    url: path === "/" ? `${base}/` : `${base}${path}`,
    changeFrequency,
    priority,
  }));
  return [...pages, ...(await listingEntries(base))];
}
