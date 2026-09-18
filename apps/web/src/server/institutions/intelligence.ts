import { getDb } from "@studepartment/db";

export async function getInstitutionalIntelligence(organizationId: string) {
  const db = getDb();
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    include: {
      labs: {
        orderBy: [{ verified: "desc" }, { name: "asc" }],
        include: {
          members: {
            include: {
              researcher: {
                include: {
                  topics: { include: { topic: true } },
                  methods: { include: { method: true } },
                },
              },
            },
          },
        },
      },
      affiliations: {
        where: { current: true, researcher: { profilePublic: true } },
        include: {
          researcher: {
            include: {
              topics: { include: { topic: true } },
              methods: { include: { method: true } },
              publications: { where: { active: true }, select: { id: true } },
            },
          },
        },
      },
      opportunities: {
        where: {
          status: "ACTIVE",
          OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
        },
        orderBy: [{ lastVerifiedAt: "desc" }, { deadline: "asc" }],
        take: 12,
        include: {
          topics: { include: { topic: true } },
          methods: { include: { method: true } },
        },
      },
    },
  });
  if (!organization) return null;

  const topicCounts = new Map<string, number>();
  const methodCounts = new Map<string, number>();
  for (const affiliation of organization.affiliations) {
    for (const relation of affiliation.researcher.topics) {
      topicCounts.set(relation.topic.name, (topicCounts.get(relation.topic.name) ?? 0) + 1);
    }
    for (const relation of affiliation.researcher.methods) {
      methodCounts.set(relation.method.name, (methodCounts.get(relation.method.name) ?? 0) + 1);
    }
  }
  const rank = (map: Map<string, number>) =>
    Array.from(map.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 12);

  return {
    id: organization.id,
    name: organization.name,
    type: organization.type.toLowerCase().replaceAll("_", " "),
    countryCode: organization.countryCode,
    website: organization.website,
    verified: organization.verified,
    researchers: organization.affiliations.map((item) => ({
      id: item.researcher.id,
      fullName: item.researcher.fullName,
      headline: item.researcher.headline ?? item.researcher.careerStage ?? "Medical researcher",
      title: item.title,
      verified: item.researcher.verified,
      publicationCount: item.researcher.publications.length,
    })),
    labs: organization.labs.map((lab) => ({
      id: lab.id,
      name: lab.name,
      description: lab.description,
      verified: lab.verified,
      memberCount: lab.members.length,
      website: lab.website,
    })),
    opportunities: organization.opportunities.map((opportunity) => ({
      id: opportunity.id,
      title: opportunity.title,
      type: opportunity.type.toLowerCase().replaceAll("_", " "),
      deadline: opportunity.deadline?.toISOString(),
      deadlinePrecision: opportunity.deadlinePrecision.toLowerCase().replaceAll("_", "-"),
      sourceUrl: opportunity.sourceUrl,
      lastVerifiedAt: opportunity.lastVerifiedAt?.toISOString() ?? opportunity.lastSeenAt.toISOString(),
    })),
    topics: rank(topicCounts).map(([name, count]) => ({ name, researcherCount: count })),
    methods: rank(methodCounts).map(([name, count]) => ({ name, researcherCount: count })),
  };
}
