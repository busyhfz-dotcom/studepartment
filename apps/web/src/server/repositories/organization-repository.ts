import { getDb } from "@studepartment/db";
import type { OrganizationOption } from "@/lib/api-contracts";

const fixtureOrganizations: OrganizationOption[] = [
  { id: "org-oxford", name: "University of Oxford", type: "UNIVERSITY", countryCode: "GB", verified: true },
  { id: "org-karolinska", name: "Karolinska Institutet", type: "UNIVERSITY", countryCode: "SE", verified: true },
];

export async function listOrganizationOptions(): Promise<OrganizationOption[]> {
  if (!process.env.DATABASE_URL) return fixtureOrganizations;

  const organizations = await getDb().organization.findMany({
    orderBy: [{ verified: "desc" }, { name: "asc" }],
    take: 100,
    select: { id: true, name: true, type: true, countryCode: true, verified: true },
  });

  return organizations.map((organization) => ({
    ...organization,
    type: organization.type,
  }));
}
