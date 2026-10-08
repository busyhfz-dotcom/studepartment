-- Role and organization specific profile details without widening every profile row.
ALTER TYPE "OrganizationType" ADD VALUE IF NOT EXISTS 'LABORATORY';

ALTER TABLE "ResearcherProfile"
  ADD COLUMN "profileDetails" JSONB;

ALTER TABLE "Organization"
  ADD COLUMN "profileDetails" JSONB;
