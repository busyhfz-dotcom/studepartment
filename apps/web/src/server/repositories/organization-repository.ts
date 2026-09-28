import { getDb } from "@studepartment/db";
import type {
  InstitutionalOrganizationType,
  OrganizationCreateInput,
  OrganizationOption,
  OrganizationProfileResponse,
  OrganizationUpdateInput,
} from "@/lib/api-contracts";

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

const organizationTypeToDb = {
  university: "UNIVERSITY",
  hospital: "HOSPITAL",
  "research-institute": "RESEARCH_INSTITUTE",
  company: "COMPANY",
  foundation: "FOUNDATION",
} as const satisfies Record<InstitutionalOrganizationType, string>;

const organizationTypeFromDb = {
  UNIVERSITY: "university",
  HOSPITAL: "hospital",
  RESEARCH_INSTITUTE: "research-institute",
  COMPANY: "company",
  FOUNDATION: "foundation",
} as const satisfies Record<string, InstitutionalOrganizationType>;

export class OrganizationRepositoryError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "OrganizationRepositoryError";
  }
}

type OwnedOrganizationRow = {
  id: string;
  name: string;
  type: keyof typeof organizationTypeFromDb;
  countryCode: string | null;
  website: string | null;
  description: string | null;
  logoUrl: string | null;
  contactEmail: string | null;
  sizeLabel: string | null;
  verified: boolean;
  claimedAt: Date | null;
  _count: { opportunities: number; affiliations: number };
};

function mapOwnedOrganization(row: OwnedOrganizationRow): OrganizationProfileResponse {
  return {
    id: row.id,
    name: row.name,
    type: organizationTypeFromDb[row.type],
    countryCode: row.countryCode,
    website: row.website,
    description: row.description,
    logoUrl: row.logoUrl,
    contactEmail: row.contactEmail,
    sizeLabel: row.sizeLabel,
    verified: row.verified,
    claimedAt: row.claimedAt ? row.claimedAt.toISOString() : null,
    activeOpportunityCount: row._count.opportunities,
    affiliatedResearcherCount: row._count.affiliations,
  };
}

let fixtureOwnedOrganization: OrganizationProfileResponse | null = null;

const ownedOrganizationSelect = {
  id: true,
  name: true,
  type: true,
  countryCode: true,
  website: true,
  description: true,
  logoUrl: true,
  contactEmail: true,
  sizeLabel: true,
  verified: true,
  claimedAt: true,
  _count: { select: { opportunities: true, affiliations: true } },
} as const;

export async function getOwnedOrganization(userId: string): Promise<OrganizationProfileResponse | null> {
  if (!process.env.DATABASE_URL) return fixtureOwnedOrganization;

  const organization = await getDb().organization.findUnique({
    where: { ownerUserId: userId },
    select: ownedOrganizationSelect,
  });
  return organization ? mapOwnedOrganization(organization) : null;
}

function normalizedName(name: string) {
  return name.trim().toLowerCase().replaceAll(/\s+/g, " ");
}

export async function createOwnedOrganization(
  userId: string,
  input: OrganizationCreateInput,
): Promise<OrganizationProfileResponse> {
  if (!process.env.DATABASE_URL) {
    if (fixtureOwnedOrganization) {
      throw new OrganizationRepositoryError("ORGANIZATION_ALREADY_CLAIMED", "An institutional profile is already registered for this account.");
    }
    fixtureOwnedOrganization = {
      id: "org-owned-fixture",
      name: input.name,
      type: input.type,
      countryCode: input.countryCode ?? null,
      website: input.website ?? null,
      description: input.description ?? null,
      logoUrl: null,
      contactEmail: input.contactEmail ?? null,
      sizeLabel: input.sizeLabel ?? null,
      verified: false,
      claimedAt: new Date().toISOString(),
      activeOpportunityCount: 0,
      affiliatedResearcherCount: 0,
    };
    return fixtureOwnedOrganization;
  }

  const db = getDb();
  const existing = await db.organization.findUnique({ where: { ownerUserId: userId }, select: { id: true } });
  if (existing) {
    throw new OrganizationRepositoryError("ORGANIZATION_ALREADY_CLAIMED", "An institutional profile is already registered for this account.");
  }

  const created = await db.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: input.name,
        normalizedName: normalizedName(input.name),
        type: organizationTypeToDb[input.type],
        countryCode: input.countryCode ?? null,
        website: input.website ?? null,
        description: input.description ?? null,
        contactEmail: input.contactEmail ?? null,
        sizeLabel: input.sizeLabel ?? null,
        ownerUserId: userId,
        claimedAt: new Date(),
      },
      select: ownedOrganizationSelect,
    });
    await tx.user.update({ where: { id: userId }, data: { accountKind: "INSTITUTION" } });
    return organization;
  });

  return mapOwnedOrganization(created);
}

export async function updateOwnedOrganization(
  userId: string,
  input: OrganizationUpdateInput,
): Promise<OrganizationProfileResponse> {
  if (!process.env.DATABASE_URL) {
    if (!fixtureOwnedOrganization) {
      throw new OrganizationRepositoryError("ORGANIZATION_NOT_FOUND", "No institutional profile is registered for this account.");
    }
    fixtureOwnedOrganization = {
      ...fixtureOwnedOrganization,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.countryCode !== undefined ? { countryCode: input.countryCode } : {}),
      ...(input.website !== undefined ? { website: input.website } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.contactEmail !== undefined ? { contactEmail: input.contactEmail } : {}),
      ...(input.sizeLabel !== undefined ? { sizeLabel: input.sizeLabel } : {}),
    };
    return fixtureOwnedOrganization;
  }

  const db = getDb();
  const existing = await db.organization.findUnique({ where: { ownerUserId: userId }, select: { id: true } });
  if (!existing) {
    throw new OrganizationRepositoryError("ORGANIZATION_NOT_FOUND", "No institutional profile is registered for this account.");
  }

  const updated = await db.organization.update({
    where: { id: existing.id },
    data: {
      ...(input.name !== undefined ? { name: input.name, normalizedName: normalizedName(input.name) } : {}),
      ...(input.type !== undefined ? { type: organizationTypeToDb[input.type] } : {}),
      ...(input.countryCode !== undefined ? { countryCode: input.countryCode } : {}),
      ...(input.website !== undefined ? { website: input.website } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.contactEmail !== undefined ? { contactEmail: input.contactEmail } : {}),
      ...(input.sizeLabel !== undefined ? { sizeLabel: input.sizeLabel } : {}),
    },
    select: ownedOrganizationSelect,
  });

  return mapOwnedOrganization(updated);
}
