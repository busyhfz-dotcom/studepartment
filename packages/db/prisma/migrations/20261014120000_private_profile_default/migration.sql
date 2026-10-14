-- Apply only to new profiles. Preserve every existing user's visibility choice.
ALTER TABLE "ResearcherProfile" ALTER COLUMN "profilePublic" SET DEFAULT false;
