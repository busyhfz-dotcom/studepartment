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

  const [oncology, immunotherapy, biomarkers, computational, translational, biomarkerAnalysis, machineLearning] = await Promise.all([
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
