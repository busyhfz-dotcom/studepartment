import { OpportunityStatus, OpportunityType, PrismaClient, VerificationStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const charite = await prisma.institution.upsert({
    where: { slug: "charite-berlin" },
    update: {},
    create: { slug: "charite-berlin", name: "Charité – Universitätsmedizin Berlin", shortName: "Charité", city: "Berlin", country: "Germany", verified: true },
  });
  const nki = await prisma.institution.upsert({
    where: { slug: "netherlands-cancer-institute" },
    update: {},
    create: { slug: "netherlands-cancer-institute", name: "Netherlands Cancer Institute", shortName: "NKI", city: "Amsterdam", country: "Netherlands", verified: true },
  });
  const lab = await prisma.lab.upsert({
    where: { slug: "nki-tumor-microenvironment" },
    update: {},
    create: { slug: "nki-tumor-microenvironment", name: "Tumor Microenvironment Program", institutionId: nki.id, description: "Translational program studying immune context and treatment response." },
  });

  const topicNames = ["Tumor immunology", "Precision oncology", "Biomarkers", "Spatial transcriptomics"];
  const topics = await Promise.all(topicNames.map((name) => prisma.researchTopic.upsert({
    where: { name },
    update: {},
    create: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") },
  })));

  const maya = await prisma.researcher.upsert({
    where: { slug: "dr-maya-chen" },
    update: {},
    create: {
      slug: "dr-maya-chen",
      firstName: "Maya",
      lastName: "Chen",
      headline: "Translational Oncology Researcher",
      bio: "Translational researcher studying tumor–immune interactions and biomarker-guided therapeutic response in solid tumors.",
      city: "Berlin",
      country: "Germany",
      institutionId: charite.id,
      verificationStatus: VerificationStatus.VERIFIED,
      topics: { create: topics.slice(0, 3).map((topic, index) => ({ topicId: topic.id, expertise: 5 - index })) },
    },
  });

  await prisma.user.upsert({
    where: { email: "maya.demo@studepartment.local" },
    update: { researcherId: maya.id },
    create: { email: "maya.demo@studepartment.local", displayName: "Dr. Maya Chen", researcherId: maya.id },
  });

  await prisma.opportunity.upsert({
    where: { slug: "postdoc-spatial-immuno-oncology" },
    update: {},
    create: {
      slug: "postdoc-spatial-immuno-oncology",
      title: "Postdoctoral Fellow — Spatial Immuno-Oncology",
      summary: "Map immune niches associated with therapy response using spatial transcriptomics and matched clinical cohorts.",
      description: "A translational postdoctoral project combining spatial profiling and clinical cohorts to investigate response and resistance.",
      type: OpportunityType.POSTDOC,
      status: OpportunityStatus.OPEN,
      city: "Amsterdam",
      country: "Netherlands",
      fundingLabel: "3-year funded position",
      deadline: new Date("2026-10-28T23:59:00Z"),
      institutionId: nki.id,
      labId: lab.id,
      topics: { create: [topics[0], topics[2], topics[3]].map((topic) => ({ topicId: topic.id, importance: 4 })) },
    },
  });

  console.log("Seed complete: scientific identity and opportunity demo data created.");
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(async () => prisma.$disconnect());
