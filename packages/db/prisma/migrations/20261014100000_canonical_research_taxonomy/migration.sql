-- These are product reference data, not demo records. Provision them during
-- deployment so a fresh database can save the choices offered by the profile UI.
-- Preserve existing IDs and metadata when an installation already has the terms.
INSERT INTO "ResearchTopic" ("id", "slug", "name") VALUES
  ('topic-oncology', 'oncology', 'Oncology'),
  ('topic-cancer-immunotherapy', 'cancer-immunotherapy', 'Cancer immunotherapy'),
  ('topic-biomarkers', 'biomarkers', 'Biomarkers'),
  ('topic-clinical-trials', 'clinical-trials', 'Clinical trials'),
  ('topic-computational-oncology', 'computational-oncology', 'Computational oncology')
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "ResearchMethod" ("id", "slug", "name") VALUES
  ('method-clinical-trial-design', 'clinical-trial-design', 'Clinical trial design'),
  ('method-translational-research', 'translational-research', 'Translational research'),
  ('method-biomarker-analysis', 'biomarker-analysis', 'Biomarker analysis'),
  ('method-machine-learning', 'machine-learning', 'Machine learning')
ON CONFLICT ("slug") DO NOTHING;
