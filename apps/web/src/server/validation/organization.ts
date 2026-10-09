import type {
  InstitutionalOrganizationType,
  OrganizationProfileDetails,
  OrganizationCreateInput,
  OrganizationUpdateInput,
} from "@/lib/api-contracts";
import { isUploadedProfileImage } from "@/lib/profile-image-url";

const organizationTypes = new Set<InstitutionalOrganizationType>([
  "university",
  "hospital",
  "laboratory",
  "research-institute",
  "company",
  "foundation",
]);

export class OrganizationValidationError extends Error {
  readonly code = "INVALID_ORGANIZATION_INPUT";

  constructor(message: string) {
    super(message);
    this.name = "OrganizationValidationError";
  }
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new OrganizationValidationError("Request body must be a JSON object.");
  }
  return value as Record<string, unknown>;
}

function optionalString(
  value: unknown,
  field: string,
  maxLength: number,
  options: { nullable?: boolean; requiredWhenPresent?: boolean } = {},
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null && options.nullable) return null;
  if (typeof value !== "string") {
    throw new OrganizationValidationError(`${field} must be a string.`);
  }
  const normalized = value.trim();
  if (!normalized && options.requiredWhenPresent) {
    throw new OrganizationValidationError(`${field} cannot be empty.`);
  }
  if (normalized.length > maxLength) {
    throw new OrganizationValidationError(`${field} must be at most ${maxLength} characters.`);
  }
  if (!normalized && options.nullable) return null;
  return normalized;
}

function optionalCountryCode(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value === "string" && /^[A-Za-z]{2}$/.test(value.trim())) {
    return value.trim().toUpperCase();
  }
  throw new OrganizationValidationError("countryCode must be a two-letter ISO country code.");
}

function optionalUrl(value: unknown, field: string): string | null | undefined {
  const parsed = optionalString(value, field, 300, { nullable: true });
  if (!parsed) return parsed;
  if (field === "logoUrl" && isUploadedProfileImage(parsed)) return parsed;
  try {
    const url = new URL(parsed);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("bad-protocol");
  } catch {
    throw new OrganizationValidationError(`${field} must be a valid http(s) URL.`);
  }
  return parsed;
}

function optionalEmail(value: unknown, field: string): string | null | undefined {
  const parsed = optionalString(value, field, 200, { nullable: true });
  if (!parsed) return parsed;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed)) {
    throw new OrganizationValidationError(`${field} must be a valid email address.`);
  }
  return parsed;
}

function requireType(value: unknown): InstitutionalOrganizationType {
  if (typeof value !== "string" || !organizationTypes.has(value as InstitutionalOrganizationType)) {
    throw new OrganizationValidationError("type must be one of university, hospital, laboratory, research-institute, company, foundation.");
  }
  return value as InstitutionalOrganizationType;
}

const createKeys = new Set(["name", "type", "countryCode", "website", "description", "logoUrl", "contactEmail", "sizeLabel", "profileDetails"]);
const updateKeys = createKeys;
const profileDetailKeys = new Set<keyof OrganizationProfileDetails>([
  "primaryFocus", "services", "facilities", "accreditations", "capacity", "fundingAreas",
  "departments", "researchPrograms", "notableProjects", "partnerships", "careers",
  "researcherServices", "dataResources", "ethicsGovernance",
]);

function organizationDetails(value: unknown): OrganizationProfileDetails | undefined {
  if (value === undefined) return undefined;
  const object = asObject(value);
  const unknown = Object.keys(object).filter((key) => !profileDetailKeys.has(key as keyof OrganizationProfileDetails));
  if (unknown.length) throw new OrganizationValidationError(`Unknown organization-specific fields: ${unknown.join(", ")}.`);
  const result: OrganizationProfileDetails = {};
  for (const key of profileDetailKeys) {
    const parsed = optionalString(object[key], `profileDetails.${key}`, 500, { nullable: true });
    if (parsed !== undefined) Object.assign(result, { [key]: parsed });
  }
  return result;
}

export function parseOrganizationCreateInput(value: unknown): OrganizationCreateInput {
  const object = asObject(value);
  const unknownKeys = Object.keys(object).filter((key) => !createKeys.has(key));
  if (unknownKeys.length > 0) {
    throw new OrganizationValidationError(`Unknown organization fields: ${unknownKeys.join(", ")}.`);
  }

  const name = optionalString(object.name, "name", 200, { requiredWhenPresent: true });
  if (!name) throw new OrganizationValidationError("name is required.");

  return {
    name,
    type: requireType(object.type),
    countryCode: optionalCountryCode(object.countryCode) ?? null,
    website: optionalUrl(object.website, "website") ?? null,
    description: optionalString(object.description, "description", 2000, { nullable: true }) ?? null,
    logoUrl: optionalUrl(object.logoUrl, "logoUrl") ?? null,
    contactEmail: optionalEmail(object.contactEmail, "contactEmail") ?? null,
    sizeLabel: optionalString(object.sizeLabel, "sizeLabel", 60, { nullable: true }) ?? null,
    profileDetails: organizationDetails(object.profileDetails),
  };
}

export function parseOrganizationUpdateInput(value: unknown): OrganizationUpdateInput {
  const object = asObject(value);
  const unknownKeys = Object.keys(object).filter((key) => !updateKeys.has(key));
  if (unknownKeys.length > 0) {
    throw new OrganizationValidationError(`Unknown organization fields: ${unknownKeys.join(", ")}.`);
  }
  if (Object.keys(object).length === 0) {
    throw new OrganizationValidationError("At least one organization field must be provided.");
  }

  const result: OrganizationUpdateInput = {};

  const name = optionalString(object.name, "name", 200, { requiredWhenPresent: true });
  if (name !== undefined && name !== null) result.name = name;

  if (object.type !== undefined) result.type = requireType(object.type);

  const countryCode = optionalCountryCode(object.countryCode);
  if (countryCode !== undefined) result.countryCode = countryCode;

  const website = optionalUrl(object.website, "website");
  if (website !== undefined) result.website = website;

  const description = optionalString(object.description, "description", 2000, { nullable: true });
  if (description !== undefined) result.description = description;

  const logoUrl = optionalUrl(object.logoUrl, "logoUrl");
  if (logoUrl !== undefined) result.logoUrl = logoUrl;

  const contactEmail = optionalEmail(object.contactEmail, "contactEmail");
  if (contactEmail !== undefined) result.contactEmail = contactEmail;

  const sizeLabel = optionalString(object.sizeLabel, "sizeLabel", 60, { nullable: true });
  if (sizeLabel !== undefined) result.sizeLabel = sizeLabel;

  const profileDetails = organizationDetails(object.profileDetails);
  if (profileDetails !== undefined) result.profileDetails = profileDetails;

  return result;
}
