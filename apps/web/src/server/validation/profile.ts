import { isUploadedProfileImage } from "@/lib/profile-image-url";
import { uploadedFileId } from "@/lib/files";
import type {
  CollaborationGoalValue,
  CareerPreferences,
  IndividualProfileDetails,
  IndividualProfileRole,
  ProfileLanguageEntry,
  ProfileLinks,
  ProfileProjectEntry,
  ProfileRecognitionEntry,
  ProfileTimelineEntry,
  ProfileUpdateInput,
} from "@/lib/api-contracts";
import { assertValidOrcid } from "@/server/integrations/orcid/orcid-id";

const allowedKeys = new Set([
  "fullName",
  "headline",
  "imageUrl",
  "bio",
  "city",
  "countryCode",
  "careerStage",
  "organizationId",
  "orcid",
  "profilePublic",
  "availability",
  "collaborationGoals",
  "topicSlugs",
  "methodSlugs",
  "accountRole",
  "profileDetails",
]);

const accountRoles = new Set<IndividualProfileRole>(["student", "researcher", "professor"]);
const profileDetailKeys = new Set<keyof IndividualProfileDetails>([
  "degreeProgram", "graduationYear", "thesisTopic", "supervisorName", "academicTitle", "department",
  "currentProject", "yearsExperience", "labName", "supervisionStatus",
  "skills", "orcidKeywords", "languages", "experience", "education", "projects", "awards", "grants",
  "memberships", "teaching", "peerReview", "links", "careerPreferences",
]);

const collaborationGoals = new Set<CollaborationGoalValue>([
  "research-collaboration",
  "mentorship",
  "student-supervision",
  "clinical-project",
  "grant-partnership",
  "position-opportunities",
]);

const availabilityValues = new Set(["open", "selective", "quiet", "closed"] as const);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const idPattern = /^[A-Za-z0-9_-]+$/;

export class ProfileValidationError extends Error {
  readonly code = "INVALID_PROFILE_UPDATE";

  constructor(message: string) {
    super(message);
    this.name = "ProfileValidationError";
  }
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ProfileValidationError("Profile update must be a JSON object.");
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
    throw new ProfileValidationError(`${field} must be a string.`);
  }
  const normalized = value.trim();
  if (!normalized && options.requiredWhenPresent) {
    throw new ProfileValidationError(`${field} cannot be empty.`);
  }
  if (normalized.length > maxLength) {
    throw new ProfileValidationError(`${field} must be at most ${maxLength} characters.`);
  }
  if (!normalized && options.nullable) return null;
  return normalized;
}

function slugList(value: unknown, field: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 20) {
    throw new ProfileValidationError(`${field} must be an array with at most 20 values.`);
  }

  return Array.from(
    new Set(
      value.map((item) => {
        if (typeof item !== "string") {
          throw new ProfileValidationError(`${field} must contain only string slugs.`);
        }
        const slug = item.trim().toLowerCase();
        if (!slugPattern.test(slug)) {
          throw new ProfileValidationError(`${field} contains an invalid slug.`);
        }
        return slug;
      }),
    ),
  );
}

function stringList(value: unknown, field: string, limit = 40): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > limit) {
    throw new ProfileValidationError(`${field} must contain at most ${limit} items.`);
  }
  return Array.from(new Set(value.map((item) => {
    if (typeof item !== "string") throw new ProfileValidationError(`${field} must contain only text values.`);
    const normalized = item.trim();
    if (!normalized || normalized.length > 160) throw new ProfileValidationError(`${field} contains an invalid item.`);
    return normalized;
  })));
}

function safeUrl(value: unknown, field: string): string | null | undefined {
  const parsed = optionalString(value, field, 2048, { nullable: true });
  if (!parsed) return parsed;
  if (uploadedFileId(parsed)) return parsed;
  try {
    const url = new URL(parsed);
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error('protocol');
    return parsed;
  } catch {
    throw new ProfileValidationError(`${field} must be a valid http(s) URL.`);
  }
}

function objectList<T extends object>(
  value: unknown,
  field: string,
  allowed: readonly string[],
  required: string,
  limit = 20,
): T[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > limit) throw new ProfileValidationError(`${field} must contain at most ${limit} items.`);
  return value.map((item, index) => {
    const object = asObject(item);
    const unknown = Object.keys(object).filter((key) => !allowed.includes(key));
    if (unknown.length) throw new ProfileValidationError(`${field}[${index}] contains unsupported fields.`);
    const result: Record<string, string | null> = {};
    for (const key of allowed) {
      const parsed = key === "url"
        ? safeUrl(object[key], `${field}[${index}].${key}`)
        : optionalString(object[key], `${field}[${index}].${key}`, key === "description" ? 1200 : 240, { nullable: true });
      if (parsed !== undefined) result[key] = parsed;
    }
    if (!result[required]) {
      if (Object.values(result).some(Boolean)) throw new ProfileValidationError(`${field}[${index}].${required} is required.`);
      return null;
    }
    return result as unknown as T;
  }).filter((item): item is T => item !== null);
}

function profileLinks(value: unknown): ProfileLinks | undefined {
  if (value === undefined) return undefined;
  const object = asObject(value);
  const keys: Array<keyof ProfileLinks> = ["website", "cv", "linkedin", "researchGate", "googleScholar", "github"];
  if (Object.keys(object).some((key) => !keys.includes(key as keyof ProfileLinks))) throw new ProfileValidationError("profileDetails.links contains unsupported fields.");
  return Object.fromEntries(keys.map((key) => [key, safeUrl(object[key], `profileDetails.links.${key}`)]).filter(([, value]) => value !== undefined)) as ProfileLinks;
}

function careerPreferences(value: unknown): CareerPreferences | undefined {
  if (value === undefined) return undefined;
  const object = asObject(value);
  const keys = ["targetRoles", "targetCountries", "opportunityTypes", "remotePreference", "relocation"];
  if (Object.keys(object).some((key) => !keys.includes(key))) throw new ProfileValidationError("profileDetails.careerPreferences contains unsupported fields.");
  return {
    targetRoles: stringList(object.targetRoles, "profileDetails.careerPreferences.targetRoles", 20),
    targetCountries: stringList(object.targetCountries, "profileDetails.careerPreferences.targetCountries", 20),
    opportunityTypes: stringList(object.opportunityTypes, "profileDetails.careerPreferences.opportunityTypes", 20),
    remotePreference: optionalString(object.remotePreference, "profileDetails.careerPreferences.remotePreference", 120, { nullable: true }),
    relocation: optionalString(object.relocation, "profileDetails.careerPreferences.relocation", 120, { nullable: true }),
  };
}

function individualDetails(value: unknown): IndividualProfileDetails | undefined {
  if (value === undefined) return undefined;
  const object = asObject(value);
  const unknown = Object.keys(object).filter((key) => !profileDetailKeys.has(key as keyof IndividualProfileDetails));
  if (unknown.length) throw new ProfileValidationError(`Unknown role-specific fields: ${unknown.join(", ")}.`);
  const result: IndividualProfileDetails = {};
  const scalarKeys = Array.from(profileDetailKeys).filter((key) => ![
    "skills", "orcidKeywords", "languages", "experience", "education", "projects", "awards", "grants",
    "memberships", "teaching", "peerReview", "links", "careerPreferences",
  ].includes(key));
  for (const key of scalarKeys) {
    const parsed = optionalString(object[key], `profileDetails.${key}`, 240, { nullable: true });
    if (parsed !== undefined) Object.assign(result, { [key]: parsed });
  }
  result.skills = stringList(object.skills, "profileDetails.skills");
  result.orcidKeywords = stringList(object.orcidKeywords, "profileDetails.orcidKeywords");
  result.memberships = stringList(object.memberships, "profileDetails.memberships");
  result.teaching = stringList(object.teaching, "profileDetails.teaching");
  result.peerReview = stringList(object.peerReview, "profileDetails.peerReview");
  result.languages = objectList<ProfileLanguageEntry>(object.languages, "profileDetails.languages", ["name", "proficiency"], "name", 20);
  result.experience = objectList<ProfileTimelineEntry>(object.experience, "profileDetails.experience", ["title", "organization", "period", "description", "url"], "title");
  result.education = objectList<ProfileTimelineEntry>(object.education, "profileDetails.education", ["title", "organization", "period", "description", "url"], "title");
  result.projects = objectList<ProfileProjectEntry>(object.projects, "profileDetails.projects", ["title", "role", "status", "description", "url"], "title");
  result.awards = objectList<ProfileRecognitionEntry>(object.awards, "profileDetails.awards", ["title", "issuer", "year", "description", "url"], "title");
  result.grants = objectList<ProfileRecognitionEntry>(object.grants, "profileDetails.grants", ["title", "issuer", "year", "description", "url"], "title");
  result.links = profileLinks(object.links);
  result.careerPreferences = careerPreferences(object.careerPreferences);
  return result;
}

export function parseProfileUpdateInput(value: unknown): ProfileUpdateInput {
  const object = asObject(value);
  const unknownKeys = Object.keys(object).filter((key) => !allowedKeys.has(key));
  if (unknownKeys.length > 0) {
    throw new ProfileValidationError(`Unknown profile fields: ${unknownKeys.join(", ")}.`);
  }
  if (Object.keys(object).length === 0) {
    throw new ProfileValidationError("At least one profile field must be provided.");
  }

  const result: ProfileUpdateInput = {};

  const fullName = optionalString(object.fullName, "fullName", 160, { requiredWhenPresent: true });
  if (fullName !== undefined && fullName !== null) result.fullName = fullName;

  const headline = optionalString(object.headline, "headline", 220, { nullable: true });
  if (headline !== undefined) result.headline = headline;

  if (object.imageUrl !== undefined) {
    const imageUrl = optionalString(object.imageUrl, "imageUrl", 2048, { nullable: true });
    if (!imageUrl) result.imageUrl = imageUrl;
    else if (isUploadedProfileImage(imageUrl)) result.imageUrl = imageUrl;
    else {
      try {
        const url = new URL(imageUrl);
        if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("bad-protocol");
        result.imageUrl = imageUrl;
      } catch {
        throw new ProfileValidationError("imageUrl must be a valid http(s) URL.");
      }
    }
  }

  const bio = optionalString(object.bio, "bio", 3000, { nullable: true });
  if (bio !== undefined) result.bio = bio;

  const city = optionalString(object.city, "city", 120, { nullable: true });
  if (city !== undefined) result.city = city;

  const careerStage = optionalString(object.careerStage, "careerStage", 120, { nullable: true });
  if (careerStage !== undefined) result.careerStage = careerStage;

  if (object.countryCode !== undefined) {
    if (object.countryCode === null || object.countryCode === "") {
      result.countryCode = null;
    } else if (typeof object.countryCode === "string" && /^[A-Za-z]{2}$/.test(object.countryCode.trim())) {
      result.countryCode = object.countryCode.trim().toUpperCase();
    } else {
      throw new ProfileValidationError("countryCode must be a two-letter ISO country code.");
    }
  }

  if (object.organizationId !== undefined) {
    if (object.organizationId === null || object.organizationId === "") {
      result.organizationId = null;
    } else if (
      typeof object.organizationId === "string" &&
      object.organizationId.length <= 128 &&
      idPattern.test(object.organizationId)
    ) {
      result.organizationId = object.organizationId;
    } else {
      throw new ProfileValidationError("organizationId is invalid.");
    }
  }

  if (object.orcid !== undefined) {
    if (object.orcid === null || object.orcid === "") {
      result.orcid = null;
    } else if (typeof object.orcid === "string") {
      try { result.orcid = assertValidOrcid(object.orcid); }
      catch { throw new ProfileValidationError("Enter a valid ORCID iD or public ORCID record URL."); }
    } else {
      throw new ProfileValidationError("orcid must be a valid ORCID iD string.");
    }
  }

  if (object.profilePublic !== undefined) {
    if (typeof object.profilePublic !== "boolean") {
      throw new ProfileValidationError("profilePublic must be a boolean.");
    }
    result.profilePublic = object.profilePublic;
  }

  if (object.availability !== undefined) {
    if (
      typeof object.availability !== "string" ||
      !availabilityValues.has(object.availability as "open" | "selective" | "quiet" | "closed")
    ) {
      throw new ProfileValidationError("availability is invalid.");
    }
    result.availability = object.availability as "open" | "selective" | "quiet" | "closed";
  }

  if (object.collaborationGoals !== undefined) {
    if (!Array.isArray(object.collaborationGoals) || object.collaborationGoals.length > 12) {
      throw new ProfileValidationError("collaborationGoals must be an array with at most 12 values.");
    }
    const values = Array.from(new Set(object.collaborationGoals));
    if (
      values.some(
        (item) => typeof item !== "string" || !collaborationGoals.has(item as CollaborationGoalValue),
      )
    ) {
      throw new ProfileValidationError("collaborationGoals contains an unsupported value.");
    }
    result.collaborationGoals = values as CollaborationGoalValue[];
  }

  result.topicSlugs = slugList(object.topicSlugs, "topicSlugs");
  result.methodSlugs = slugList(object.methodSlugs, "methodSlugs");

  if (object.accountRole !== undefined) {
    if (typeof object.accountRole !== "string" || !accountRoles.has(object.accountRole as IndividualProfileRole)) {
      throw new ProfileValidationError("accountRole must be student, researcher, or professor.");
    }
    result.accountRole = object.accountRole as IndividualProfileRole;
  }
  result.profileDetails = individualDetails(object.profileDetails);

  return result;
}
