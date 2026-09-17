import type {
  CollaborationGoalValue,
  ProfileUpdateInput,
} from "@/lib/api-contracts";
import { assertValidOrcid } from "@/server/integrations/orcid/orcid-id";

const allowedKeys = new Set([
  "fullName",
  "headline",
  "bio",
  "city",
  "countryCode",
  "careerStage",
  "orcid",
  "profilePublic",
  "availability",
  "collaborationGoals",
  "topicSlugs",
  "methodSlugs",
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

  const normalized = Array.from(
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

  return normalized;
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
  if (fullName !== undefined) result.fullName = fullName;

  const headline = optionalString(object.headline, "headline", 220, { nullable: true });
  if (headline !== undefined) result.headline = headline;

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

  if (object.orcid !== undefined) {
    if (object.orcid === null || object.orcid === "") {
      result.orcid = null;
    } else if (typeof object.orcid === "string") {
      result.orcid = assertValidOrcid(object.orcid);
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

  return result;
}
