CREATE TYPE "OpportunitySourceType" AS ENUM ('INSTITUTIONAL_CAREERS', 'FUNDER', 'LAB_WEBSITE', 'RESEARCH_NETWORK', 'MANUAL', 'IMPORT');
CREATE TYPE "OpportunityStatus" AS ENUM ('ACTIVE', 'CLOSED', 'EXPIRED', 'STALE');
CREATE TYPE "OpportunityDeadlinePrecision" AS ENUM ('EXACT', 'DATE_ONLY', 'MONTH_ONLY', 'ROLLING', 'UNKNOWN');
CREATE TYPE "OpportunityProvenanceStatus" AS ENUM ('ASSERTED', 'VERIFIED', 'STALE', 'DISPUTED');

ALTER TABLE "Opportunity"
  ADD COLUMN "status" "OpportunityStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "city" TEXT,
  ADD COLUMN "countryCode" TEXT,
  ADD COLUMN "applicationUrl" TEXT,
  ADD COLUMN "deadlineRaw" TEXT,
  ADD COLUMN "deadlinePrecision" "OpportunityDeadlinePrecision" NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN "deadlineTimezone" TEXT,
  ADD COLUMN "sourceType" "OpportunitySourceType" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "sourceName" TEXT NOT NULL DEFAULT 'legacy',
  ADD COLUMN "sourceRecordId" TEXT,
  ADD COLUMN "sourceKey" TEXT,
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "eligibleCareerStages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "eligibleCountryCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Opportunity"
SET
  "sourceRecordId" = "id",
  "sourceKey" = 'legacy:' || "id",
  "lastSeenAt" = COALESCE("lastVerifiedAt", CURRENT_TIMESTAMP),
  "firstSeenAt" = COALESCE("lastVerifiedAt", CURRENT_TIMESTAMP);

ALTER TABLE "Opportunity"
  ALTER COLUMN "sourceRecordId" SET NOT NULL,
  ALTER COLUMN "sourceKey" SET NOT NULL;

CREATE UNIQUE INDEX "Opportunity_sourceKey_key" ON "Opportunity"("sourceKey");
CREATE INDEX "Opportunity_status_deadline_idx" ON "Opportunity"("status", "deadline");
CREATE INDEX "Opportunity_sourceType_sourceName_idx" ON "Opportunity"("sourceType", "sourceName");
CREATE INDEX "Opportunity_lastSeenAt_idx" ON "Opportunity"("lastSeenAt");

CREATE TABLE "OpportunityTopic" (
  "opportunityId" TEXT NOT NULL,
  "topicId" TEXT NOT NULL,
  "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
  CONSTRAINT "OpportunityTopic_pkey" PRIMARY KEY ("opportunityId", "topicId"),
  CONSTRAINT "OpportunityTopic_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OpportunityTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "ResearchTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "OpportunityTopic_topicId_idx" ON "OpportunityTopic"("topicId");

CREATE TABLE "OpportunityMethod" (
  "opportunityId" TEXT NOT NULL,
  "methodId" TEXT NOT NULL,
  CONSTRAINT "OpportunityMethod_pkey" PRIMARY KEY ("opportunityId", "methodId"),
  CONSTRAINT "OpportunityMethod_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OpportunityMethod_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "ResearchMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "OpportunityMethod_methodId_idx" ON "OpportunityMethod"("methodId");

CREATE TABLE "OpportunityProvenance" (
  "id" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "sourceType" "OpportunitySourceType" NOT NULL,
  "sourceName" TEXT NOT NULL,
  "sourceRecordId" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "contentFingerprint" TEXT NOT NULL,
  "status" "OpportunityProvenanceStatus" NOT NULL DEFAULT 'ASSERTED',
  "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" TIMESTAMP(3),
  "metadata" JSONB,
  CONSTRAINT "OpportunityProvenance_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OpportunityProvenance_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "OpportunityProvenance_opportunityId_contentFingerprint_key" ON "OpportunityProvenance"("opportunityId", "contentFingerprint");
CREATE INDEX "OpportunityProvenance_sourceType_sourceName_sourceRecordId_idx" ON "OpportunityProvenance"("sourceType", "sourceName", "sourceRecordId");
CREATE INDEX "OpportunityProvenance_status_observedAt_idx" ON "OpportunityProvenance"("status", "observedAt");
