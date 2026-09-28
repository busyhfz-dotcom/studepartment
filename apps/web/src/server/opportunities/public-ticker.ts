import { getDb } from "@studepartment/db";

export type PublicTickerItem = {
  id: string;
  title: string;
  organization: string;
  countryCode: string | null;
  deadlineLabel: string;
};

export type PublicOpportunityTicker = {
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

const fixtureTicker: PublicOpportunityTicker = {
  generatedAt: new Date().toISOString(),
  positions: [
    { id: "demo-postdoc-1", title: "Postdoctoral Researcher · Cancer Immunotherapy", organization: "Studepartment Demo Research Institute", countryCode: "DE", deadlineLabel: "Deadline in 6 weeks" },
    { id: "demo-phd-1", title: "PhD Position · Computational Oncology", organization: "Nordic Biomedical Graduate School", countryCode: "SE", deadlineLabel: "Rolling / no fixed deadline" },
    { id: "demo-fellowship-1", title: "Clinical Research Fellowship · Neuro-oncology", organization: "Alpine University Hospital", countryCode: "CH", deadlineLabel: "Deadline in 3 weeks" },
  ],
  grants: [
    { id: "demo-grant-1", title: "Early-Career Investigator Grant · Translational Immunology", organization: "European Biomedical Research Council", countryCode: "BE", deadlineLabel: "Deadline in 2 months" },
    { id: "demo-grant-2", title: "Seed Funding · Rare Disease Genomics", organization: "Pacific Genomics Foundation", countryCode: "US", deadlineLabel: "Deadline in 5 weeks" },
  ],
  stats: { totalPositions: 3, totalGrants: 2, countries: 4 },
};

export async function getPublicOpportunityTicker(): Promise<PublicOpportunityTicker> {
  if (!process.env.DATABASE_URL) return fixtureTicker;

  const db = getDb();
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
    generatedAt: now.toISOString(),
    positions: map(positions).length ? map(positions) : fixtureTicker.positions,
    grants: map(grants).length ? map(grants) : fixtureTicker.grants,
    stats: {
      totalPositions: totalPositions || fixtureTicker.stats.totalPositions,
      totalGrants: totalGrants || fixtureTicker.stats.totalGrants,
      countries: countries.length || fixtureTicker.stats.countries,
    },
  };
}
