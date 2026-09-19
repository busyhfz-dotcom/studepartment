ALTER TYPE "ConnectionStatus" ADD VALUE IF NOT EXISTS 'WITHDRAWN';
ALTER TYPE "ConnectionStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

CREATE TYPE "ConnectionEventType" AS ENUM ('CREATED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED', 'ARCHIVED');

CREATE TABLE "IntroductionPolicy" (
  "id" TEXT NOT NULL,
  "researcherId" TEXT NOT NULL,
  "allowIntroductions" BOOLEAN NOT NULL DEFAULT true,
  "requireVerifiedSender" BOOLEAN NOT NULL DEFAULT false,
  "allowedPurposes" "ConnectionPurpose"[] NOT NULL DEFAULT ARRAY[]::"ConnectionPurpose"[],
  "cooldownDays" INTEGER NOT NULL DEFAULT 30,
  "maxInboundPerDay" INTEGER NOT NULL DEFAULT 10,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IntroductionPolicy_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "IntroductionPolicy_researcherId_fkey" FOREIGN KEY ("researcherId") REFERENCES "ResearcherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "IntroductionPolicy_researcherId_key" ON "IntroductionPolicy"("researcherId");

ALTER TABLE "ConnectionRequest"
  ADD COLUMN "contextFingerprint" TEXT,
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "respondedAt" TIMESTAMP(3),
  ADD COLUMN "withdrawnAt" TIMESTAMP(3),
  ADD COLUMN "archivedAt" TIMESTAMP(3);

UPDATE "ConnectionRequest"
SET "expiresAt" = COALESCE("createdAt", CURRENT_TIMESTAMP) + INTERVAL '14 days'
WHERE "expiresAt" IS NULL AND "status" = 'PENDING';

WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "senderId", "receiverId"
      ORDER BY "createdAt" DESC, "id" DESC
    ) AS rn
  FROM "ConnectionRequest"
  WHERE "status" = 'PENDING'
)
UPDATE "ConnectionRequest"
SET "status" = 'ARCHIVED',
    "archivedAt" = CURRENT_TIMESTAMP
WHERE "id" IN (SELECT "id" FROM ranked WHERE rn > 1);

CREATE UNIQUE INDEX "ConnectionRequest_active_pair_key"
  ON "ConnectionRequest"("senderId", "receiverId")
  WHERE "status" = 'PENDING';

CREATE INDEX "ConnectionRequest_senderId_createdAt_idx" ON "ConnectionRequest"("senderId", "createdAt");
CREATE INDEX "ConnectionRequest_receiverId_createdAt_idx" ON "ConnectionRequest"("receiverId", "createdAt");

CREATE TABLE "ConnectionRequestEvent" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "type" "ConnectionEventType" NOT NULL,
  "actorResearcherId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  CONSTRAINT "ConnectionRequestEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ConnectionRequestEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ConnectionRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ConnectionRequestEvent_actorResearcherId_fkey" FOREIGN KEY ("actorResearcherId") REFERENCES "ResearcherProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "ConnectionRequestEvent_requestId_createdAt_idx" ON "ConnectionRequestEvent"("requestId", "createdAt");
CREATE INDEX "ConnectionRequestEvent_actorResearcherId_createdAt_idx" ON "ConnectionRequestEvent"("actorResearcherId", "createdAt");
