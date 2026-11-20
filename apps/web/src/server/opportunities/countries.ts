import { getDb, type Prisma } from "@studepartment/db";
import { isCountryCode } from "@/lib/countries";

export function activeOpportunityWhere(now = new Date()): Prisma.OpportunityWhereInput {
  return {
    status: "ACTIVE",
    lastSeenAt: { gte: new Date(now.getTime() - 45 * 86_400_000) },
    OR: [{ deadline: null }, { deadline: { gte: now } }],
  };
}

/** The same pool is used by every category, even when a category has zero matches. */
export async function getOpportunityCountries(): Promise<string[]> {
  if (!process.env.DATABASE_URL) return ["DE"];
  try {
    const rows = await getDb().opportunity.groupBy({
      by: ["countryCode"],
      where: { ...activeOpportunityWhere(), countryCode: { not: null } },
    });
    return rows.flatMap(({ countryCode }) => countryCode && isCountryCode(countryCode) ? [countryCode] : []);
  } catch (error) {
    console.error("[opportunities] location list unavailable", error);
    return [];
  }
}
