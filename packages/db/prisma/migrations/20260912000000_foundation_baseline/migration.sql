-- Baseline for the v0.1 scientific-domain schema that originally existed in
-- development before Prisma migration history was committed to the repository.
--
-- Existing databases that already contain these objects must mark this
-- migration as applied with `prisma migrate resolve --applied
-- 20260912000000_foundation_baseline` before running migrate deploy.

CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'RESEARCHER', 'PROFESSOR', 'LAB_ADMIN', 'INSTITUTION_ADMIN');
CREATE TYPE "OrganizationType" AS ENUM ('UNIVERSITY', 'HOSPITAL', 'RESEARCH_INSTITUTE', 'COMPANY', 'FOUNDATION');
CREATE TYPE "OpportunityType" AS ENUM ('PHD', 'POSTDOC', 'FELLOWSHIP', 'GRANT', 'COLLABORATION', 'RESEARCH_ASSISTANTSHIP');
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'ARCHIVED');
CREATE TYPE "ConnectionPurpose" AS ENUM ('RESEARCH_DISCUSSION', 'COLLABORATION', 'MENTORSHIP', 'POSITION_INQUIRY', 'GRANT_PARTNERSHIP', 'CLINICAL_PROJECT');
CREATE TYPE "AvailabilityMode" AS ENUM ('OPEN', 'SELECTIVE', 'QUIET', 'CLOSED');
CREATE TYPE "CollaborationGoal" AS ENUM ('RESEARCH_COLLABORATION', 'MENTORSHIP', 'STUDENT_SUPERVISION', 'CLINICAL_PROJECT', 'GRANT_PARTNERSHIP', 'POSITION_OPPORTUNITIES');
CREATE TYPE "ProficiencyLevel" AS ENUM ('LEARNING', 'WORKING', 'ADVANCED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ResearcherProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "fullName" TEXT NOT NULL,
  "headline" TEXT,
  "bio" TEXT,
  "countryCode" TEXT,
  "city" TEXT,
  "careerStage" TEXT,
  "orcid" TEXT,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "profilePublic" BOOLEAN NOT NULL DEFAULT true,
  "availabilityMode" "AvailabilityMode" NOT NULL DEFAULT 'SELECTIVE',
  "collaborationGoals" "CollaborationGoal"[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ResearcherProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Organization" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "type" "OrganizationType" NOT NULL,
  "countryCode" TEXT,
  "website" TEXT,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ResearcherAffiliation" (
  "id" TEXT NOT NULL,
  "researcherId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "title" TEXT,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "current" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "ResearcherAffiliation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ResearchTopic" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "parentId" TEXT,
  "meshId" TEXT,
  CONSTRAINT "ResearchTopic_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ResearcherTopic" (
  "researcherId" TEXT NOT NULL,
  "topicId" TEXT NOT NULL,
  "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
  CONSTRAINT "ResearcherTopic_pkey" PRIMARY KEY ("researcherId", "topicId")
);

CREATE TABLE "ResearchMethod" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  CONSTRAINT "ResearchMethod_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ResearcherMethod" (
  "researcherId" TEXT NOT NULL,
  "methodId" TEXT NOT NULL,
  "proficiency" "ProficiencyLevel" NOT NULL DEFAULT 'WORKING',
  CONSTRAINT "ResearcherMethod_pkey" PRIMARY KEY ("researcherId", "methodId")
);

CREATE TABLE "Publication" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "abstract" TEXT,
  "doi" TEXT,
  "pmid" TEXT,
  "journal" TEXT,
  "publicationDate" TIMESTAMP(3),
  "citationCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ResearcherPublication" (
  "researcherId" TEXT NOT NULL,
  "publicationId" TEXT NOT NULL,
  "authorOrder" INTEGER,
  CONSTRAINT "ResearcherPublication_pkey" PRIMARY KEY ("researcherId", "publicationId")
);

CREATE TABLE "Laboratory" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "website" TEXT,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "Laboratory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LabMember" (
  "laboratoryId" TEXT NOT NULL,
  "researcherId" TEXT NOT NULL,
  "role" TEXT,
  CONSTRAINT "LabMember_pkey" PRIMARY KEY ("laboratoryId", "researcherId")
);

CREATE TABLE "Opportunity" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "type" "OpportunityType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "deadline" TIMESTAMP(3),
  "sourceUrl" TEXT NOT NULL,
  "lastVerifiedAt" TIMESTAMP(3),
  CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConnectionRequest" (
  "id" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "receiverId" TEXT NOT NULL,
  "purpose" "ConnectionPurpose" NOT NULL,
  "context" TEXT,
  "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ConnectionRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "ResearcherProfile_userId_key" ON "ResearcherProfile"("userId");
CREATE UNIQUE INDEX "ResearcherProfile_orcid_key" ON "ResearcherProfile"("orcid");
CREATE INDEX "Organization_normalizedName_idx" ON "Organization"("normalizedName");
CREATE INDEX "ResearcherAffiliation_researcherId_idx" ON "ResearcherAffiliation"("researcherId");
CREATE INDEX "ResearcherAffiliation_organizationId_idx" ON "ResearcherAffiliation"("organizationId");
CREATE UNIQUE INDEX "ResearchTopic_slug_key" ON "ResearchTopic"("slug");
CREATE UNIQUE INDEX "ResearchMethod_slug_key" ON "ResearchMethod"("slug");
CREATE UNIQUE INDEX "Publication_doi_key" ON "Publication"("doi");
CREATE UNIQUE INDEX "Publication_pmid_key" ON "Publication"("pmid");
CREATE INDEX "Laboratory_organizationId_idx" ON "Laboratory"("organizationId");
CREATE INDEX "Opportunity_organizationId_type_idx" ON "Opportunity"("organizationId", "type");
CREATE INDEX "Opportunity_deadline_idx" ON "Opportunity"("deadline");
CREATE INDEX "ConnectionRequest_receiverId_status_idx" ON "ConnectionRequest"("receiverId", "status");
CREATE INDEX "ConnectionRequest_senderId_status_idx" ON "ConnectionRequest"("senderId", "status");

ALTER TABLE "ResearcherProfile"
  ADD CONSTRAINT "ResearcherProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ResearcherAffiliation"
  ADD CONSTRAINT "ResearcherAffiliation_researcherId_fkey"
  FOREIGN KEY ("researcherId") REFERENCES "ResearcherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResearcherAffiliation"
  ADD CONSTRAINT "ResearcherAffiliation_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ResearchTopic"
  ADD CONSTRAINT "ResearchTopic_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "ResearchTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ResearcherTopic"
  ADD CONSTRAINT "ResearcherTopic_researcherId_fkey"
  FOREIGN KEY ("researcherId") REFERENCES "ResearcherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResearcherTopic"
  ADD CONSTRAINT "ResearcherTopic_topicId_fkey"
  FOREIGN KEY ("topicId") REFERENCES "ResearchTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ResearcherMethod"
  ADD CONSTRAINT "ResearcherMethod_researcherId_fkey"
  FOREIGN KEY ("researcherId") REFERENCES "ResearcherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResearcherMethod"
  ADD CONSTRAINT "ResearcherMethod_methodId_fkey"
  FOREIGN KEY ("methodId") REFERENCES "ResearchMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ResearcherPublication"
  ADD CONSTRAINT "ResearcherPublication_researcherId_fkey"
  FOREIGN KEY ("researcherId") REFERENCES "ResearcherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResearcherPublication"
  ADD CONSTRAINT "ResearcherPublication_publicationId_fkey"
  FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Laboratory"
  ADD CONSTRAINT "Laboratory_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LabMember"
  ADD CONSTRAINT "LabMember_laboratoryId_fkey"
  FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LabMember"
  ADD CONSTRAINT "LabMember_researcherId_fkey"
  FOREIGN KEY ("researcherId") REFERENCES "ResearcherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Opportunity"
  ADD CONSTRAINT "Opportunity_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConnectionRequest"
  ADD CONSTRAINT "ConnectionRequest_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "ResearcherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConnectionRequest"
  ADD CONSTRAINT "ConnectionRequest_receiverId_fkey"
  FOREIGN KEY ("receiverId") REFERENCES "ResearcherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
