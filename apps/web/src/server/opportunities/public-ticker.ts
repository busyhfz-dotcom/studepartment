import type { Prisma } from "@studepartment/db";
import { isCountryCode } from "@/lib/countries";
import { opportunityRegion, opportunityRegions, opportunitySubjects } from "@/lib/opportunity-filters";
import { getDb } from "@studepartment/db";
import { getCurrentUser } from "@/server/auth/current-user";
import { activeOpportunityWhere } from "./countries";

export type PublicTickerItem = {
  id: string;
  title: string;
  organization: string;
  organizationWebsite?: string | null;
  countryCode: string | null;
  deadline: string | null;
  deadlinePrecision?: string;
  deadlineLabel: string;
  /** First collected in the last 24 hours. */
  isNew: boolean;
  saves: number;
  saved: boolean;
};

export type PublicOpportunityTicker = {
  available: boolean;
  positions: PublicTickerItem[];
  grants: PublicTickerItem[];
  generatedAt: string;
  /** When the collector last saw any listing at its source. */
  lastCollectedAt: string | null;
  stats: {
    totalPositions: number;
    totalGrants: number;
    countries: number;
  };
};

function formatDeadline(deadline: Date | null, precision: string): string {
  if (!deadline) return precision === "ROLLING" ? "Rolling deadline" : "Deadline on the listing";
  if (precision === "MONTH_ONLY") {
    return `Deadline ${deadline.toLocaleDateString(undefined, { month: "long", year: "numeric" })}`;
  }
  return `Deadline ${deadline.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

export type TickerFilters = { location?: string | null; subject?: string | null };

export async function getPublicOpportunityTicker(filters?: TickerFilters): Promise<PublicOpportunityTicker> {
  const unavailable: PublicOpportunityTicker = {
    available: false, generatedAt: new Date().toISOString(), lastCollectedAt: null, positions: [], grants: [],
    stats: { totalPositions: 0, totalGrants: 0, countries: 0 },
  };
  if (!process.env.DATABASE_URL) return unavailable;
  try {
    const user = await getCurrentUser().catch(() => null);
    return await loadPublicOpportunityTicker(getDb(), new Date(), filters, user?.id);
  } catch (error) {
    console.error("[opportunities] public ticker unavailable", error);
    return unavailable;
  }
}

export async function loadPublicOpportunityTicker(
  db: Pick<ReturnType<typeof getDb>, "opportunity">,
  now = new Date(),
  filters: TickerFilters = {},
  userId?: string,
): Promise<PublicOpportunityTicker> {
  const windowMs = 30 * 86_400_000;
  const cutoff = new Date(now.getTime() - windowMs);
  const deadlineLimit = new Date(now.getTime() + windowMs);
  const regionKey = opportunityRegion(filters.location ?? null);
  const conditions: Prisma.OpportunityWhereInput[] = [{ OR: [{ deadline:null }, {deadline:{lte:deadlineLimit}}] }];
  if (regionKey) {
    const region = opportunityRegions[regionKey];
    conditions.push({ OR: [
      { countryCode:{ in:[...region.countries] } },
      { countryCode:null, provenance:{ some:{ metadata:{ path:["fundingRegion"], equals:region.label } } } },
    ] });
  } else if (filters.location && isCountryCode(filters.location)) conditions.push({ countryCode:filters.location.toUpperCase() });
  const subject = opportunitySubjects.find(([slug])=>slug===filters.subject)?.[0];
  if (subject === "machine-learning") conditions.push({ methods:{ some:{method:{slug:subject}} } });
  else if (subject) conditions.push({ topics:{ some:{topic:{slug:subject}} } });
  const activeUpcoming = {
    ...activeOpportunityWhere(now),
    publishedAt: { gte: cutoff, lte: now },
    AND: conditions,
  };
  const newestFirst = [{ publishedAt: { sort: "desc" as const, nulls: "last" as const } }, { firstSeenAt: "desc" as const }];
  const itemSelection = {
    id: true,
    title: true,
    countryCode: true,
    deadline: true,
    deadlinePrecision: true,
    firstSeenAt: true,
    publishedAt: true,
    organization: { select: { name: true, website: true } },
    _count: { select: { savedBy: true } },
    ...(userId ? { savedBy: { where: { userId }, select: { userId: true }, take: 1 } } : {}),
  } satisfies Prisma.OpportunitySelect;

  const [positions, grants, totalPositions, totalGrants, countries, latest] = await Promise.all([
    db.opportunity.findMany({
      where: { ...activeUpcoming, type: { notIn: ["GRANT", "MASTERS_SCHOLARSHIP", "PHD_SCHOLARSHIP", "MD_SCHOLARSHIP"] } },
      orderBy: newestFirst,
      take: 8,
      select: itemSelection,
    }),
    db.opportunity.findMany({
      where: { ...activeUpcoming, type: "GRANT" },
      orderBy: newestFirst,
      take: 8,
      select: itemSelection,
    }),
    db.opportunity.count({ where: { ...activeUpcoming, type: { notIn: ["GRANT", "MASTERS_SCHOLARSHIP", "PHD_SCHOLARSHIP", "MD_SCHOLARSHIP"] } } }),
    db.opportunity.count({ where: { ...activeUpcoming, type: "GRANT" } }),
    db.opportunity.findMany({
      where: { ...activeUpcoming, countryCode: { not: null } },
      distinct: ["countryCode"],
      select: { countryCode: true },
    }),
    db.opportunity.aggregate({ _max: { lastSeenAt: true } }),
  ]);
  const newSince = now.getTime() - 86_400_000;

  const map = (rows: typeof positions): PublicTickerItem[] =>
    rows.map((row) => ({
      id: row.id,
      title: row.title,
      organization: row.organization.name,
      organizationWebsite: row.organization.website,
      countryCode: row.countryCode,
      deadline: row.deadline?.toISOString() ?? null,
      deadlinePrecision: row.deadlinePrecision.toLowerCase().replaceAll("_", "-"),
      deadlineLabel: formatDeadline(row.deadline, row.deadlinePrecision),
      isNew: (row.publishedAt ?? row.firstSeenAt).getTime() >= newSince,
      saves: row._count?.savedBy ?? 0,
      saved: Boolean(userId && row.savedBy?.length),
    }));

  return {
    available: true,
    generatedAt: now.toISOString(),
    lastCollectedAt: latest._max.lastSeenAt?.toISOString() ?? null,
    positions: map(positions),
    grants: map(grants),
    stats: {
      totalPositions,
      totalGrants,
      countries: countries.length,
    },
  };
}
