import { getDb } from "@studepartment/db";

export type PublicTickerItem = {
  id: string;
  title: string;
  organization: string;
  countryCode: string | null;
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
  if (!deadline) return "Rolling / no fixed deadline";
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
  const activeUpcoming = { status: "ACTIVE" as const, OR: [{ deadline: null }, { deadline: { gte: now } }] };

  const [positions, grants, totalPositions, totalGrants, countries] = await Promise.all([
    db.opportunity.findMany({
      where: { ...activeUpcoming, type: { not: "GRANT" } },
      orderBy: [{ lastSeenAt: "desc" }],
      take: 10,
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
      orderBy: [{ lastSeenAt: "desc" }],
      take: 10,
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
