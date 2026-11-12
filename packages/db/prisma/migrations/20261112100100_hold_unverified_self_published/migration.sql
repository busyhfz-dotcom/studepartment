-- Take already-public self-published postings from unverified institutions out of search
-- until the institution is verified. Runs separately because a new enum value cannot be
-- used in the transaction that adds it.
UPDATE "Opportunity" AS o
SET "status" = 'PENDING_REVIEW'
FROM "Organization" AS org
WHERE o."organizationId" = org."id"
  AND o."sourceKey" LIKE 'self:%'
  AND o."status" = 'ACTIVE'
  AND org."verified" = false;
