CREATE TYPE "ApplicationStage" AS ENUM ('SAVED', 'PREPARING', 'APPLIED', 'INTERVIEW', 'DECISION', 'CLOSED');
ALTER TABLE "SavedOpportunity" ADD COLUMN "applicationStage" "ApplicationStage" NOT NULL DEFAULT 'SAVED';
CREATE INDEX "SavedOpportunity_userId_applicationStage_idx" ON "SavedOpportunity"("userId", "applicationStage");
