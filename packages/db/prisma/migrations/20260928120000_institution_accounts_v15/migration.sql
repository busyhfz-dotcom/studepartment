-- Institution accounts: distinct profile system for individual researchers vs.
-- institutional/legal-entity accounts (labs, hospitals, universities, funders).
-- Also adds lightweight weekly digest preferences reused for positions + grants.

CREATE TYPE "AccountKind" AS ENUM ('INDIVIDUAL', 'INSTITUTION');
CREATE TYPE "DigestFrequency" AS ENUM ('WEEKLY', 'OFF');

ALTER TABLE "User"
  ADD COLUMN "accountKind" "AccountKind" NOT NULL DEFAULT 'INDIVIDUAL',
  ADD COLUMN "digestFrequency" "DigestFrequency" NOT NULL DEFAULT 'WEEKLY',
  ADD COLUMN "lastDigestSentAt" TIMESTAMP(3);

ALTER TABLE "Organization"
  ADD COLUMN "ownerUserId" TEXT,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "logoUrl" TEXT,
  ADD COLUMN "contactEmail" TEXT,
  ADD COLUMN "sizeLabel" TEXT,
  ADD COLUMN "claimedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Organization_ownerUserId_key" ON "Organization"("ownerUserId");

ALTER TABLE "Organization"
  ADD CONSTRAINT "Organization_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Personalization signal store for behavior-driven recommendations (item 7).
-- Aggregates lightweight interest weights per user per research topic, derived
-- from search activity, saves, and feedback, without storing raw query text
-- longer than needed for the rolling weight update.
CREATE TABLE "UserInterestSignal" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "topicId" TEXT NOT NULL,
  "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lastEventAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserInterestSignal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserInterestSignal_userId_topicId_key" ON "UserInterestSignal"("userId", "topicId");
CREATE INDEX "UserInterestSignal_userId_weight_idx" ON "UserInterestSignal"("userId", "weight");

ALTER TABLE "UserInterestSignal"
  ADD CONSTRAINT "UserInterestSignal_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserInterestSignal"
  ADD CONSTRAINT "UserInterestSignal_topicId_fkey"
  FOREIGN KEY ("topicId") REFERENCES "ResearchTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Records a user's free-text search queries at low volume, used only to derive
-- UserInterestSignal weights and never displayed to other users.
CREATE TABLE "SearchQueryLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "queryText" TEXT NOT NULL,
  "context" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SearchQueryLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SearchQueryLog_userId_createdAt_idx" ON "SearchQueryLog"("userId", "createdAt");

ALTER TABLE "SearchQueryLog"
  ADD CONSTRAINT "SearchQueryLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
