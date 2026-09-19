CREATE TYPE "FeedbackEntityType" AS ENUM ('RESEARCHER', 'LABORATORY', 'INSTITUTION', 'OPPORTUNITY');
CREATE TYPE "FeedbackSignal" AS ENUM ('RELEVANT', 'NOT_RELEVANT', 'ALREADY_KNOW', 'WRONG_CAREER_STAGE', 'WRONG_FIELD', 'NOT_AVAILABLE');
CREATE TYPE "ProductEventType" AS ENUM ('PROFILE_UPDATED', 'FEEDBACK_SUBMITTED', 'OPPORTUNITY_SAVED', 'INTRODUCTION_SENT', 'ASSISTANT_USED', 'DATA_EXPORTED');

CREATE TABLE "DiscoveryFeedback" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "entityType" "FeedbackEntityType" NOT NULL,
  "entityId" TEXT NOT NULL,
  "signal" "FeedbackSignal" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DiscoveryFeedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "eventType" "ProductEventType" NOT NULL,
  "entityType" "FeedbackEntityType",
  "entityId" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DiscoveryFeedback_userId_entityType_entityId_key" ON "DiscoveryFeedback"("userId", "entityType", "entityId");
CREATE INDEX "DiscoveryFeedback_userId_signal_idx" ON "DiscoveryFeedback"("userId", "signal");
CREATE INDEX "DiscoveryFeedback_entityType_entityId_idx" ON "DiscoveryFeedback"("entityType", "entityId");
CREATE INDEX "ProductEvent_userId_occurredAt_idx" ON "ProductEvent"("userId", "occurredAt");
CREATE INDEX "ProductEvent_eventType_occurredAt_idx" ON "ProductEvent"("eventType", "occurredAt");

ALTER TABLE "DiscoveryFeedback"
  ADD CONSTRAINT "DiscoveryFeedback_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductEvent"
  ADD CONSTRAINT "ProductEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
