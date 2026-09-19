CREATE TABLE "SavedOpportunity" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "deadlineAlert" BOOLEAN NOT NULL DEFAULT true,
  "alertLeadDays" INTEGER NOT NULL DEFAULT 7,
  "notes" TEXT,
  "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastAlertedAt" TIMESTAMP(3),
  CONSTRAINT "SavedOpportunity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SavedOpportunity_userId_opportunityId_key" ON "SavedOpportunity"("userId", "opportunityId");
CREATE INDEX "SavedOpportunity_userId_savedAt_idx" ON "SavedOpportunity"("userId", "savedAt");
CREATE INDEX "SavedOpportunity_deadlineAlert_lastAlertedAt_idx" ON "SavedOpportunity"("deadlineAlert", "lastAlertedAt");

ALTER TABLE "SavedOpportunity"
  ADD CONSTRAINT "SavedOpportunity_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SavedOpportunity"
  ADD CONSTRAINT "SavedOpportunity_opportunityId_fkey"
  FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SavedOpportunity"
  ADD CONSTRAINT "SavedOpportunity_alertLeadDays_check"
  CHECK ("alertLeadDays" BETWEEN 1 AND 90);
