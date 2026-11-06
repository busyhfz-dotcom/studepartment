ALTER TABLE "User"
ADD COLUMN "organizationTypePreference" TEXT,
ADD COLUMN "organizationDraft" JSONB NOT NULL DEFAULT '{}';
