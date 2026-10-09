CREATE TABLE "ProfileImage" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "data" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProfileImage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProfileImage_ownerId_createdAt_idx" ON "ProfileImage"("ownerId", "createdAt");
ALTER TABLE "ProfileImage" ADD CONSTRAINT "ProfileImage_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
