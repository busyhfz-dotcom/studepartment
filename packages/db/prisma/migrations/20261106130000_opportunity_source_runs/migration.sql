CREATE TABLE "OpportunitySourceRun" (
    "sourceId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "status" TEXT,
    "durationMs" INTEGER,
    "leaseToken" TEXT,
    "leaseUntil" TIMESTAMP(3),
    CONSTRAINT "OpportunitySourceRun_pkey" PRIMARY KEY ("sourceId")
);
