import { db } from "../src/client";

async function main() {
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

  const topicNames = [
    ["oncology", "Oncology"],
    ["cancer-immunotherapy", "Cancer Immunotherapy"],
    ["biomarkers", "Biomarkers"],
    ["clinical-trials", "Clinical Trials"],
    ["computational-oncology", "Computational Oncology"],
  ] as const;

  for (const [slug, name] of topicNames) {
    await db.researchTopic.upsert({
      where: { slug },
      update: { name },
      create: { slug, name },
    });
  }

  const methodNames = [
    ["clinical-trial-design", "Clinical trial design"],
    ["translational-research", "Translational research"],
    ["biomarker-analysis", "Biomarker analysis"],
    ["machine-learning", "Machine learning"],
  ] as const;

  for (const [slug, name] of methodNames) {
    await db.researchMethod.upsert({
      where: { slug },
      update: { name },
      create: { slug, name },
    });
  }

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

  await db.researcherAffiliation.upsert({
    where: { id: "aff-sarah-oxford" },
    update: {},
    create: {
      id: "aff-sarah-oxford",
      researcherId: sarah.id,
      organizationId: oxford.id,
      title: "Clinical Researcher",
      current: true,
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

  await db.researcherAffiliation.upsert({
    where: { id: "aff-michael-karolinska" },
    update: {},
    create: {
      id: "aff-michael-karolinska",
      researcherId: michael.id,
      organizationId: karolinska.id,
      title: "Associate Professor",
      current: true,
    },
  });

  const oncology = await db.researchTopic.findUniqueOrThrow({ where: { slug: "oncology" } });
  const immunotherapy = await db.researchTopic.findUniqueOrThrow({ where: { slug: "cancer-immunotherapy" } });
  const biomarkers = await db.researchTopic.findUniqueOrThrow({ where: { slug: "biomarkers" } });
  const computational = await db.researchTopic.findUniqueOrThrow({ where: { slug: "computational-oncology" } });

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

  const translational = await db.researchMethod.findUniqueOrThrow({ where: { slug: "translational-research" } });
  const biomarkerAnalysis = await db.researchMethod.findUniqueOrThrow({ where: { slug: "biomarker-analysis" } });
  const machineLearning = await db.researchMethod.findUniqueOrThrow({ where: { slug: "machine-learning" } });

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
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
