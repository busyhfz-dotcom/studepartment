-- Add biomedical vocabulary without replacing existing identifiers or evidence.
INSERT INTO "ResearchTopic" ("id", "slug", "name") VALUES
('topic-immunology', 'immunology', 'Immunology'),
('topic-genomics', 'genomics', 'Genomics'),
('topic-rare-diseases', 'rare-diseases', 'Rare diseases'),
('topic-epidemiology', 'epidemiology', 'Epidemiology'),
('topic-public-health', 'public-health', 'Public health'),
('topic-nursing', 'nursing', 'Nursing'),
('topic-medical-imaging', 'medical-imaging', 'Medical imaging'),
('topic-neuroscience', 'neuroscience', 'Neuroscience'),
('topic-cardiovascular-medicine', 'cardiovascular-medicine', 'Cardiovascular medicine'),
('topic-infectious-diseases', 'infectious-diseases', 'Infectious diseases'),
('topic-pharmacology', 'pharmacology', 'Pharmacology'),
('topic-bioinformatics', 'bioinformatics', 'Bioinformatics'),
('topic-biomedical-engineering', 'biomedical-engineering', 'Biomedical engineering'),
('topic-health-informatics', 'health-informatics', 'Health informatics'),
('topic-mental-health', 'mental-health', 'Mental health'),
('topic-pediatrics', 'pediatrics', 'Pediatrics'),
('topic-reproductive-health', 'reproductive-health', 'Reproductive health'),
('topic-rehabilitation', 'rehabilitation', 'Rehabilitation'),
('topic-health-services-research', 'health-services-research', 'Health services research')
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "ResearchMethod" ("id", "slug", "name") VALUES
('method-systematic-review', 'systematic-review', 'Systematic review'),
('method-meta-analysis', 'meta-analysis', 'Meta-analysis'),
('method-qualitative-research', 'qualitative-research', 'Qualitative research'),
('method-biostatistics', 'biostatistics', 'Biostatistics'),
('method-cohort-studies', 'cohort-studies', 'Cohort studies'),
('method-case-control-studies', 'case-control-studies', 'Case-control studies'),
('method-single-cell-analysis', 'single-cell-analysis', 'Single-cell analysis'),
('method-spatial-transcriptomics', 'spatial-transcriptomics', 'Spatial transcriptomics'),
('method-genome-sequencing', 'genome-sequencing', 'Genome sequencing'),
('method-flow-cytometry', 'flow-cytometry', 'Flow cytometry'),
('method-medical-image-analysis', 'medical-image-analysis', 'Medical image analysis'),
('method-health-economic-evaluation', 'health-economic-evaluation', 'Health economic evaluation'),
('method-implementation-science', 'implementation-science', 'Implementation science'),
('method-patient-reported-outcomes', 'patient-reported-outcomes', 'Patient-reported outcomes')
ON CONFLICT ("slug") DO NOTHING;

