CREATE TYPE "PublicationSourceType" AS ENUM ('ORCID', 'PUBMED', 'MANUAL');
CREATE TYPE "PublicationProvenanceStatus" AS ENUM ('ASSERTED', 'VERIFIED', 'STALE', 'DISPUTED');
CREATE TYPE "PublicationEvidenceLevel" AS ENUM ('MANUAL_ASSERTED', 'ORCID_ASSERTED', 'PUBMED_CORROBORATED');

ALTER TABLE "Publication"
  ADD COLUMN "canonicalKey" TEXT,
  ADD COLUMN "pmcid" TEXT,
  ADD COLUMN "publicationType" TEXT,
  ADD COLUMN "volume" TEXT,
  ADD COLUMN "issue" TEXT,
  ADD COLUMN "pages" TEXT,
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "authorNames" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "lastVerifiedAt" TIMESTAMP(3);

UPDATE "Publication"
SET "canonicalKey" = CASE
  WHEN "pmid" IS NOT NULL AND "pmid" <> '' THEN 'pmid:' || lower("pmid")
  WHEN "doi" IS NOT NULL AND "doi" <> '' THEN 'doi:' || lower(regexp_replace("doi", '^https?://(dx\.)?doi\.org/', '', 'i'))
  ELSE 'legacy:' || "id"
END;

ALTER TABLE "Publication" ALTER COLUMN "canonicalKey" SET NOT NULL;

CREATE UNIQUE INDEX "Publication_canonicalKey_key" ON "Publication"("canonicalKey");
CREATE UNIQUE INDEX "Publication_pmcid_key" ON "Publication"("pmcid");
CREATE INDEX "Publication_publicationDate_idx" ON "Publication"("publicationDate");
CREATE INDEX "Publication_lastVerifiedAt_idx" ON "Publication"("lastVerifiedAt");

ALTER TABLE "ResearcherPublication"
  ADD COLUMN "sourceType" "PublicationSourceType" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "evidenceLevel" "PublicationEvidenceLevel" NOT NULL DEFAULT 'MANUAL_ASSERTED',
  ADD COLUMN "lastObservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "ResearcherPublication_researcherId_evidenceLevel_idx"
  ON "ResearcherPublication"("researcherId", "evidenceLevel");

CREATE TABLE "PublicationProvenance" (
  "id" TEXT NOT NULL,
  "evidenceKey" TEXT NOT NULL,
  "publicationId" TEXT NOT NULL,
  "researcherId" TEXT,
  "sourceType" "PublicationSourceType" NOT NULL,
  "sourceRecordId" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "contentFingerprint" TEXT NOT NULL,
  "status" "PublicationProvenanceStatus" NOT NULL DEFAULT 'ASSERTED',
  "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verifiedAt" TIMESTAMP(3),
  "metadata" JSONB,
  CONSTRAINT "PublicationProvenance_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PublicationProvenance_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PublicationProvenance_researcherId_fkey" FOREIGN KEY ("researcherId") REFERENCES "ResearcherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PublicationProvenance_evidenceKey_key" ON "PublicationProvenance"("evidenceKey");
CREATE INDEX "PublicationProvenance_publicationId_sourceType_idx" ON "PublicationProvenance"("publicationId", "sourceType");
CREATE INDEX "PublicationProvenance_researcherId_sourceType_observedAt_idx" ON "PublicationProvenance"("researcherId", "sourceType", "observedAt");
CREATE INDEX "PublicationProvenance_status_observedAt_idx" ON "PublicationProvenance"("status", "observedAt");
