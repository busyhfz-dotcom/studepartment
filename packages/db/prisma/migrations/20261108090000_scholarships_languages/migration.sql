ALTER TYPE "OpportunityType" ADD VALUE IF NOT EXISTS 'MASTERS_SCHOLARSHIP';
ALTER TYPE "OpportunityType" ADD VALUE IF NOT EXISTS 'PHD_SCHOLARSHIP';
CREATE TABLE IF NOT EXISTS "UiTranslation" ("id" TEXT PRIMARY KEY, "locale" TEXT NOT NULL, "catalogVersion" TEXT NOT NULL, "translations" JSONB NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS "UiTranslation_locale_catalogVersion_idx" ON "UiTranslation"("locale", "catalogVersion");
