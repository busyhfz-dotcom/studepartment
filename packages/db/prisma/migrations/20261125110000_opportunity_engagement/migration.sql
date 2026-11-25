ALTER TABLE "Opportunity" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "OpportunityLike" (
  "userId" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OpportunityLike_pkey" PRIMARY KEY ("userId", "opportunityId"),
  CONSTRAINT "OpportunityLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OpportunityLike_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "OpportunityLike_opportunityId_idx" ON "OpportunityLike"("opportunityId");

INSERT INTO "ResearchTopic" ("id", "slug", "name")
VALUES ('topic-endocrinology-diabetes', 'endocrinology-diabetes', 'Endocrinology and diabetes')
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "OpportunityTopic" ("opportunityId", "topicId")
SELECT opportunity.id, topic.id
FROM "Opportunity" AS opportunity
CROSS JOIN "ResearchTopic" AS topic
WHERE topic.slug = 'endocrinology-diabetes'
  AND opportunity.status = 'ACTIVE'
  AND concat_ws(' ', opportunity.title, opportunity.description) ~* '\m(diabet\w*|endocrin\w*|insulin|metabolic syndrome|thyroid\w*)\M'
ON CONFLICT ("opportunityId", "topicId") DO NOTHING;
