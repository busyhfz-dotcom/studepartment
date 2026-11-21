-- Add the subject filters and associate matching already-published opportunities.
WITH subjects(slug, name) AS (
  VALUES
    ('parasitology', 'Parasitology'),
    ('microbiology', 'Microbiology and bacteriology'),
    ('biochemistry', 'Biochemistry'),
    ('molecular-cell-biology', 'Molecular and cell biology'),
    ('allied-health', 'Allied health')
)
INSERT INTO "ResearchTopic" ("id", "slug", "name")
SELECT 'topic-' || slug, slug, name FROM subjects
ON CONFLICT ("slug") DO NOTHING;

UPDATE "ResearchTopic"
SET "name" = 'Biomarkers'
WHERE "slug" = 'biomarkers' AND "name" = 'parasitology';

WITH patterns(slug, pattern) AS (
  VALUES
    ('parasitology', '\m(parasitol\w*|parasiti\w*|medical entomology|malaria|leishmani\w*|helminth\w*)\M'),
    ('microbiology', '\m(microbi\w*|bacteri\w*|mycolog\w*)\M'),
    ('biochemistry', '\m(biochem\w*|proteom\w*|enzymolog\w*)\M'),
    ('molecular-cell-biology', '\m(molecular biolog\w*|molecular bioscien\w*|cell biolog\w*|structural biolog\w*)\M'),
    ('allied-health', '\m(allied health|audiolog\w*|dietet\w*|occupational therap\w*|speech and language therap\w*|physiotherap\w*|medical laboratory)\M')
)
INSERT INTO "OpportunityTopic" ("opportunityId", "topicId")
SELECT opportunity.id, topic.id
FROM "Opportunity" AS opportunity
JOIN patterns ON concat_ws(' ', opportunity."title", opportunity."description") ~* patterns.pattern
JOIN "ResearchTopic" AS topic ON topic."slug" = patterns.slug
WHERE opportunity."status" = 'ACTIVE'
ON CONFLICT ("opportunityId", "topicId") DO NOTHING;
