-- Scientific Identity v1: stable account sessions + scientific provenance.
-- This migration is intentionally additive so the existing development data
-- remains valid while authentication is introduced.

ALTER TABLE "User"
  ADD COLUMN "name" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "image" TEXT;

ALTER TABLE "User"
  ALTER COLUMN "role" SET DEFAULT 'RESEARCHER';

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Account" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP(3),
  "refreshTokenExpiresAt" TIMESTAMP(3),
  "scope" TEXT,
  "password" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Verification" (
  "id" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

CREATE TYPE "EvidenceSourceType" AS ENUM (
  'USER_ENTRY',
  'ORCID',
  'PUBMED',
  'INSTITUTIONAL_EMAIL',
  'INSTITUTIONAL_DIRECTORY',
  'MANUAL_REVIEW'
);

CREATE TYPE "EvidenceStatus" AS ENUM ('ASSERTED', 'VERIFIED', 'DISPUTED', 'STALE');

CREATE TABLE "EvidenceRecord" (
  "id" TEXT NOT NULL,
  "researcherId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "sourceType" "EvidenceSourceType" NOT NULL,
  "sourceRecordId" TEXT,
  "sourceUrl" TEXT,
  "fieldPath" TEXT NOT NULL,
  "valueFingerprint" TEXT,
  "confidence" DOUBLE PRECISION,
  "status" "EvidenceStatus" NOT NULL DEFAULT 'ASSERTED',
  "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verifiedAt" TIMESTAMP(3),
  "metadata" JSONB,
  CONSTRAINT "EvidenceRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");
CREATE INDEX "EvidenceRecord_researcherId_fieldPath_idx" ON "EvidenceRecord"("researcherId", "fieldPath");
CREATE INDEX "EvidenceRecord_sourceType_sourceRecordId_idx" ON "EvidenceRecord"("sourceType", "sourceRecordId");
CREATE INDEX "EvidenceRecord_status_observedAt_idx" ON "EvidenceRecord"("status", "observedAt");

ALTER TABLE "Session"
  ADD CONSTRAINT "Session_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Account"
  ADD CONSTRAINT "Account_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EvidenceRecord"
  ADD CONSTRAINT "EvidenceRecord_researcherId_fkey"
  FOREIGN KEY ("researcherId") REFERENCES "ResearcherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EvidenceRecord"
  ADD CONSTRAINT "EvidenceRecord_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
