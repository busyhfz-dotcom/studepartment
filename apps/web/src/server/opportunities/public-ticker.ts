import { getDb } from "@studepartment/db";

export type PublicTickerItem = {
  id: string;
  title: string;
  organization: string;
  countryCode: string | null;
  deadline: string | null;
  deadlineLabel: string;
};

export type PublicOpportunityTicker = {
  available: boolean;
  positions: PublicTickerItem[];
  grants: PublicTickerItem[];
  generatedAt: string;
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
    available: false, generatedAt: new Date().toISOString(), positions: [], grants: [],
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

export async function loadPublicOpportunityTicker(db: Pick<ReturnType<typeof getDb>, "opportunity">): Promise<PublicOpportunityTicker> {
  const now = new Date();
  // Same visibility rules as search: open, not past its deadline, and still
  // present at its source within the last 45 days.
  const activeUpcoming = {
    status: "ACTIVE" as const,
    lastSeenAt: { gte: new Date(now.getTime() - 45 * 86_400_000) },
    OR: [{ deadline: null }, { deadline: { gte: now } }],
  };
  const newestFirst = [{ publishedAt: { sort: "desc" as const, nulls: "last" as const } }, { firstSeenAt: "desc" as const }];

  const [positions, grants, totalPositions, totalGrants, countries] = await Promise.all([
    db.opportunity.findMany({
      where: { ...activeUpcoming, type: { not: "GRANT" } },
      orderBy: newestFirst,
      take: 8,
      select: {
        id: true,
        title: true,
        countryCode: true,
        deadline: true,
        deadlinePrecision: true,
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
        organization: { select: { name: true } },
      },
    }),
    db.opportunity.count({ where: { ...activeUpcoming, type: { not: "GRANT" } } }),
    db.opportunity.count({ where: { ...activeUpcoming, type: "GRANT" } }),
    db.opportunity.findMany({
      where: { ...activeUpcoming, countryCode: { not: null } },
      distinct: ["countryCode"],
      select: { countryCode: true },
    }),
  ]);

  const map = (rows: typeof positions): PublicTickerItem[] =>
    rows.map((row) => ({
      id: row.id,
      title: row.title,
      organization: row.organization.name,
      countryCode: row.countryCode,
      deadline: row.deadline?.toISOString() ?? null,
      deadlineLabel: formatDeadline(row.deadline, row.deadlinePrecision),
    }));

  return {
    available: true,
    generatedAt: now.toISOString(),
    positions: map(positions),
    grants: map(grants),
    stats: {
      totalPositions,
      totalGrants,
      countries: countries.length,
    },
  };
}
