CREATE TABLE "StoredFile" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "mediaType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "category" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "contextId" TEXT,
  "public" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'UPLOADING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StoredFile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StoredFile_size_check" CHECK ("size" > 0 AND "size" <= 20971520),
  CONSTRAINT "StoredFile_status_check" CHECK ("status" IN ('UPLOADING', 'READY')),
  CONSTRAINT "StoredFile_scope_check" CHECK ("scope" IN ('profile', 'organization', 'application', 'library'))
);
CREATE UNIQUE INDEX "StoredFile_storageKey_key" ON "StoredFile"("storageKey");
CREATE INDEX "StoredFile_ownerId_createdAt_idx" ON "StoredFile"("ownerId", "createdAt");
CREATE INDEX "StoredFile_ownerId_scope_contextId_idx" ON "StoredFile"("ownerId", "scope", "contextId");
CREATE TABLE "FileDeletion" (
  "storageKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FileDeletion_pkey" PRIMARY KEY ("storageKey")
);
CREATE TABLE "ConnectionRequestAttachment" (
  "requestId" TEXT NOT NULL,
  "fileId" TEXT NOT NULL,
  CONSTRAINT "ConnectionRequestAttachment_pkey" PRIMARY KEY ("requestId", "fileId"),
  CONSTRAINT "ConnectionRequestAttachment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ConnectionRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ConnectionRequestAttachment_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "StoredFile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ConnectionRequestAttachment_fileId_idx" ON "ConnectionRequestAttachment"("fileId");
