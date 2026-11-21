import { getDb } from "@studepartment/db";
import { activeOpportunityWhere } from "./countries";

export type PublicTickerItem = {
  id: string;
  title: string;
  organization: string;
  countryCode: string | null;
  deadline: string | null;
  deadlinePrecision?: string;
  deadlineLabel: string;
  /** First collected in the last 24 hours. */
  isNew: boolean;
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

export async function getPublicOpportunityTicker(): Promise<PublicOpportunityTicker> {
  const unavailable: PublicOpportunityTicker = {
    available: false, generatedAt: new Date().toISOString(), lastCollectedAt: null, positions: [], grants: [],
    stats: { totalPositions: 0, totalGrants: 0, countries: 0 },
  };
  if (!process.env.DATABASE_URL) return unavailable;
  try {
    return await loadPublicOpportunityTicker(getDb());
  } catch (error) {
    console.error("[opportunities] public ticker unavailable", error);
    return unavailable;
  }
}

export async function loadPublicOpportunityTicker(
  db: Pick<ReturnType<typeof getDb>, "opportunity">,
  now = new Date(),
): Promise<PublicOpportunityTicker> {
  const windowMs = 30 * 86_400_000;
  const cutoff = new Date(now.getTime() - windowMs);
  const deadlineLimit = new Date(now.getTime() + windowMs);
  const activeUpcoming = {
    ...activeOpportunityWhere(now),
    publishedAt: { gte: cutoff, lte: now },
    AND: [{ OR: [{ deadline: null }, { deadline: { lte: deadlineLimit } }] }],
  };
  const newestFirst = [{ publishedAt: { sort: "desc" as const, nulls: "last" as const } }, { firstSeenAt: "desc" as const }];

  const [positions, grants, totalPositions, totalGrants, countries, latest] = await Promise.all([
    db.opportunity.findMany({
      where: { ...activeUpcoming, type: { notIn: ["GRANT", "MASTERS_SCHOLARSHIP", "PHD_SCHOLARSHIP", "MD_SCHOLARSHIP"] } },
      orderBy: newestFirst,
      take: 8,
      select: {
        id: true,
        title: true,
        countryCode: true,
        deadline: true,
        deadlinePrecision: true,
        firstSeenAt: true,
        publishedAt: true,
        organization: { select: { name: true } },
      },
    }),
    db.opportunity.findMany({
      where: { ...activeUpcoming, type: "GRANT" },
      orderBy: newestFirst,
      take: 8,
      select: {
        id: true,
        title: true,
        countryCode: true,
        deadline: true,
        deadlinePrecision: true,
        firstSeenAt: true,
        publishedAt: true,
        organization: { select: { name: true } },
      },
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
      countryCode: row.countryCode,
      deadline: row.deadline?.toISOString() ?? null,
      deadlinePrecision: row.deadlinePrecision.toLowerCase().replaceAll("_", "-"),
      deadlineLabel: formatDeadline(row.deadline, row.deadlinePrecision),
      isNew: (row.publishedAt ?? row.firstSeenAt).getTime() >= newSince,
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
