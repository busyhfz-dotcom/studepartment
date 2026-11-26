import { getDb, type Prisma } from "@studepartment/db";
import { isCountryCode } from "@/lib/countries";

export const LISTING_STALE_AFTER_DAYS = 45;

export function activeOpportunityWhere(now = new Date(), includeStale = false): Prisma.OpportunityWhereInput {
  return {
    OR: [
      { status: { in: ["ACTIVE", "STALE"] }, deadline: { gte: now } },
      { status: "ACTIVE", deadline: null, ...(includeStale ? {} : {
        lastSeenAt: { gte: new Date(now.getTime() - LISTING_STALE_AFTER_DAYS * 86_400_000) },
      }) },
    ],
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
