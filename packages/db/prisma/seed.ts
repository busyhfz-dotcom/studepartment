import { getDb } from "../src/client";

const db = getDb();

async function upsertTaxonomy() {
  const topics = [
    ["oncology", "Oncology"],
    ["cancer-immunotherapy", "Cancer Immunotherapy"],
    ["biomarkers", "Biomarkers"],
    ["clinical-trials", "Clinical Trials"],
    ["computational-oncology", "Computational Oncology"],
  ] as const;

  const methods = [
    ["clinical-trial-design", "Clinical trial design"],
    ["translational-research", "Translational research"],
    ["biomarker-analysis", "Biomarker analysis"],
    ["machine-learning", "Machine learning"],
  ] as const;

  for (const [slug, name] of topics) {
    await db.researchTopic.upsert({ where: { slug }, update: { name }, create: { slug, name } });
  }

  for (const [slug, name] of methods) {
    await db.researchMethod.upsert({ where: { slug }, update: { name }, create: { slug, name } });
  }
}

async function main() {
  await upsertTaxonomy();

  const oxford = await db.organization.upsert({
    where: { id: "org-oxford" },
    update: {},
    create: {
      id: "org-oxford",
      name: "University of Oxford",
      normalizedName: "university of oxford",
      type: "UNIVERSITY",
      countryCode: "GB",
      verified: true,
    },
  });

  const karolinska = await db.organization.upsert({
    where: { id: "org-karolinska" },
    update: {},
    create: {
      id: "org-karolinska",
      name: "Karolinska Institutet",
      normalizedName: "karolinska institutet",
      type: "UNIVERSITY",
      countryCode: "SE",
      verified: true,
    },
  });

  const sarah = await db.researcherProfile.upsert({
    where: { id: "researcher-sarah-williams" },
    update: {},
    create: {
      id: "researcher-sarah-williams",
      fullName: "Dr. Sarah Williams",
      headline: "Clinical Researcher · Translational Oncology",
      bio: "Translational oncology researcher focused on immune-based therapies, biomarkers, and clinically actionable evidence.",
      countryCode: "GB",
      city: "Oxford",
      careerStage: "Early-career researcher",
      verified: true,
      availabilityMode: "SELECTIVE",
      collaborationGoals: ["RESEARCH_COLLABORATION", "CLINICAL_PROJECT", "GRANT_PARTNERSHIP"],
    },
  });

  const michael = await db.researcherProfile.upsert({
    where: { id: "researcher-michael-chen" },
    update: {},
    create: {
      id: "researcher-michael-chen",
      fullName: "Dr. Michael Chen",
      headline: "Associate Professor of Computational Oncology",
      countryCode: "SE",
      city: "Stockholm",
      careerStage: "Professor",
      verified: true,
      availabilityMode: "OPEN",
      collaborationGoals: ["RESEARCH_COLLABORATION", "GRANT_PARTNERSHIP"],
    },
  });

  await Promise.all([
    db.researcherAffiliation.upsert({
      where: { id: "aff-sarah-oxford" },
      update: {},
      create: { id: "aff-sarah-oxford", researcherId: sarah.id, organizationId: oxford.id, title: "Clinical Researcher" },
    }),
    db.researcherAffiliation.upsert({
      where: { id: "aff-michael-karolinska" },
      update: {},
      create: { id: "aff-michael-karolinska", researcherId: michael.id, organizationId: karolinska.id, title: "Associate Professor" },
    }),
  ]);

  const [
    oncology,
    immunotherapy,
    biomarkers,
    computational,
    translational,
    biomarkerAnalysis,
    machineLearning,
  ] = await Promise.all([
    db.researchTopic.findUniqueOrThrow({ where: { slug: "oncology" } }),
    db.researchTopic.findUniqueOrThrow({ where: { slug: "cancer-immunotherapy" } }),
    db.researchTopic.findUniqueOrThrow({ where: { slug: "biomarkers" } }),
    db.researchTopic.findUniqueOrThrow({ where: { slug: "computational-oncology" } }),
    db.researchMethod.findUniqueOrThrow({ where: { slug: "translational-research" } }),
    db.researchMethod.findUniqueOrThrow({ where: { slug: "biomarker-analysis" } }),
    db.researchMethod.findUniqueOrThrow({ where: { slug: "machine-learning" } }),
  ]);

  await db.researcherTopic.createMany({
    data: [
      { researcherId: sarah.id, topicId: oncology.id, weight: 1 },
      { researcherId: sarah.id, topicId: immunotherapy.id, weight: 0.95 },
      { researcherId: sarah.id, topicId: biomarkers.id, weight: 0.9 },
      { researcherId: michael.id, topicId: computational.id, weight: 1 },
      { researcherId: michael.id, topicId: biomarkers.id, weight: 0.9 },
    ],
    skipDuplicates: true,
  });

  await db.researcherMethod.createMany({
    data: [
      { researcherId: sarah.id, methodId: translational.id, proficiency: "ADVANCED" },
      { researcherId: sarah.id, methodId: biomarkerAnalysis.id, proficiency: "ADVANCED" },
      { researcherId: michael.id, methodId: machineLearning.id, proficiency: "ADVANCED" },
    ],
    skipDuplicates: true,
  });

  const observedAt = new Date();
  const kiOpportunity = await db.opportunity.upsert({
    where: { sourceKey: "IMPORT:studepartment-seed:ki-postdoc-immunotherapy" },
    update: { lastSeenAt: observedAt, lastVerifiedAt: observedAt },
    create: {
      organizationId: karolinska.id,
      type: "POSTDOC",
      status: "ACTIVE",
      title: "Postdoctoral Researcher · Translational Cancer Immunology",
      description: "Seed opportunity demonstrating source-aware matching across cancer immunotherapy and biomarker research.",
      city: "Stockholm",
      countryCode: "SE",
      deadline: new Date("2026-10-15T23:59:59.999Z"),
      deadlineRaw: "2026-10-15",
      deadlinePrecision: "DATE_ONLY",
      sourceType: "IMPORT",
      sourceName: "Studepartment seed",
      sourceRecordId: "ki-postdoc-immunotherapy",
      sourceKey: "IMPORT:studepartment-seed:ki-postdoc-immunotherapy",
      sourceUrl: "https://example.org/opportunities/ki-postdoc-immunotherapy",
      applicationUrl: "https://example.org/opportunities/ki-postdoc-immunotherapy/apply",
      lastVerifiedAt: observedAt,
      eligibleCareerStages: ["early-career-researcher", "postdoc"],
    },
  });

  const oxfordOpportunity = await db.opportunity.upsert({
    where: { sourceKey: "IMPORT:studepartment-seed:oxford-fellowship-oncology" },
    update: { lastSeenAt: observedAt, lastVerifiedAt: observedAt },
    create: {
      organizationId: oxford.id,
      type: "FELLOWSHIP",
      status: "ACTIVE",
      title: "Early Career Fellowship · Precision Oncology",
      description: "Seed fellowship demonstrating separate scientific relevance and published eligibility evaluation.",
      city: "Oxford",
      countryCode: "GB",
      deadline: new Date("2026-11-03T23:59:59.999Z"),
      deadlineRaw: "2026-11-03",
      deadlinePrecision: "DATE_ONLY",
      sourceType: "IMPORT",
      sourceName: "Studepartment seed",
      sourceRecordId: "oxford-fellowship-oncology",
      sourceKey: "IMPORT:studepartment-seed:oxford-fellowship-oncology",
      sourceUrl: "https://example.org/opportunities/oxford-fellowship-oncology",
      applicationUrl: "https://example.org/opportunities/oxford-fellowship-oncology/apply",
      lastVerifiedAt: observedAt,
      eligibleCareerStages: ["early-career-researcher"],
      eligibleCountryCodes: ["GB"],
    },
  });

  await Promise.all([
    db.opportunityTopic.upsert({
      where: { opportunityId_topicId: { opportunityId: kiOpportunity.id, topicId: immunotherapy.id } },
      update: { weight: 1 },
      create: { opportunityId: kiOpportunity.id, topicId: immunotherapy.id, weight: 1 },
    }),
    db.opportunityTopic.upsert({
      where: { opportunityId_topicId: { opportunityId: kiOpportunity.id, topicId: biomarkers.id } },
      update: { weight: 0.9 },
      create: { opportunityId: kiOpportunity.id, topicId: biomarkers.id, weight: 0.9 },
    }),
    db.opportunityMethod.upsert({
      where: { opportunityId_methodId: { opportunityId: kiOpportunity.id, methodId: translational.id } },
      update: {},
      create: { opportunityId: kiOpportunity.id, methodId: translational.id },
    }),
    db.opportunityTopic.upsert({
      where: { opportunityId_topicId: { opportunityId: oxfordOpportunity.id, topicId: oncology.id } },
      update: { weight: 1 },
      create: { opportunityId: oxfordOpportunity.id, topicId: oncology.id, weight: 1 },
    }),
    db.opportunityMethod.upsert({
      where: { opportunityId_methodId: { opportunityId: oxfordOpportunity.id, methodId: biomarkerAnalysis.id } },
      update: {},
      create: { opportunityId: oxfordOpportunity.id, methodId: biomarkerAnalysis.id },
    }),
  ]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
