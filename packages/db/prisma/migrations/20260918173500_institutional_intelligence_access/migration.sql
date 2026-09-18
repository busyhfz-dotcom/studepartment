CREATE TYPE "OrganizationAccessRole" AS ENUM ('VIEWER', 'ANALYST', 'ADMIN');

CREATE TABLE "OrganizationAccess" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "role" "OrganizationAccessRole" NOT NULL DEFAULT 'VIEWER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizationAccess_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrganizationAccess_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OrganizationAccess_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "OrganizationAccess_userId_organizationId_key"
  ON "OrganizationAccess"("userId", "organizationId");
CREATE INDEX "OrganizationAccess_organizationId_role_idx"
  ON "OrganizationAccess"("organizationId", "role");
CREATE INDEX "OrganizationAccess_userId_role_idx"
  ON "OrganizationAccess"("userId", "role");
