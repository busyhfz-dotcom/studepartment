import { getDb } from "@studepartment/db";
import type { InstitutionFitSnapshot, OrganizationProfileDetails } from "@/lib/api-contracts";
import { getCurrentUser } from "@/server/auth/current-user";
import { publicFiles } from "@/server/files/repository";

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
              publications: { where: { active: true }, select: { publicationId: true } },
              user: { select: { image: true } },
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
    logoUrl: organization.logoUrl,
    type: organization.type.toLowerCase().replaceAll("_", " "),
    countryCode: organization.countryCode,
    website: organization.website,
    verified: organization.verified,
    description: organization.description,
    profileDetails: (organization.profileDetails as OrganizationProfileDetails | null) ?? {},
    documents: await publicFiles(organization.ownerUserId, "organization"),
    researchers: organization.affiliations.map((item) => ({
      id: item.researcher.id,
      fullName: item.researcher.fullName,
      imageUrl: item.researcher.user?.image ?? null,
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


export async function getInstitutionFitSnapshot(organizationId: string): Promise<InstitutionFitSnapshot | null> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const db = getDb();
  const profile = await db.researcherProfile.findUnique({
    where: { userId: currentUser.id },
    include: {
      topics: { include: { topic: true } },
      methods: { include: { method: true } },
    },
  });
  if (!profile) return null;

  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      affiliations: {
        where: { current: true, researcher: { profilePublic: true } },
        select: {
          researcher: {
            select: {
              topics: { select: { topicId: true, topic: { select: { name: true } } } },
              methods: { select: { methodId: true, method: { select: { name: true } } } },
            },
          },
        },
      },
    },
  });
  if (!organization) return null;

  const institutionalTopicIds = new Map<string, string>();
  const institutionalMethodIds = new Map<string, string>();
  for (const affiliation of organization.affiliations) {
    for (const relation of affiliation.researcher.topics) {
      institutionalTopicIds.set(relation.topicId, relation.topic.name);
    }
    for (const relation of affiliation.researcher.methods) {
      institutionalMethodIds.set(relation.methodId, relation.method.name);
    }
  }

  const sharedTopics = profile.topics
    .filter((relation) => institutionalTopicIds.has(relation.topicId))
    .map((relation) => relation.topic.name);
  const sharedMethods = profile.methods
    .filter((relation) => institutionalMethodIds.has(relation.methodId))
    .map((relation) => relation.method.name);

  const topicIds = profile.topics.map((relation) => relation.topicId);
  const methodIds = profile.methods.map((relation) => relation.methodId);
  const opportunityOverlap = [
    ...(topicIds.length ? [{ topics: { some: { topicId: { in: topicIds } } } }] : []),
    ...(methodIds.length ? [{ methods: { some: { methodId: { in: methodIds } } } }] : []),
  ];

  const matchingOpportunityCount = opportunityOverlap.length
    ? await db.opportunity.count({
        where: {
          organizationId,
          status: "ACTIVE",
          OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
          AND: [{ OR: opportunityOverlap }],
        },
      })
    : 0;

  const reasons: string[] = [];
  if (sharedTopics.length) reasons.push("Shared research topics: " + sharedTopics.slice(0, 5).join(", ") + ".");
  if (sharedMethods.length) reasons.push("Shared methods: " + sharedMethods.slice(0, 5).join(", ") + ".");
  if (matchingOpportunityCount) {
    reasons.push(
      matchingOpportunityCount + " current " + (matchingOpportunityCount === 1 ? "opportunity overlaps" : "opportunities overlap") + " your recorded topics or methods.",
    );
  }

  const gaps: string[] = [];
  if (!profile.topics.length) gaps.push("Your Scientific Identity has no canonical research topics to compare.");
  else if (!sharedTopics.length) gaps.push("No exact canonical topic overlap is currently recorded.");
  if (!profile.methods.length) gaps.push("Your Scientific Identity has no canonical methods to compare.");
  else if (!sharedMethods.length) gaps.push("No exact canonical method overlap is currently recorded.");
  if (!organization.affiliations.length) gaps.push("This institution has no public current researcher evidence to derive scientific capability from.");

  return {
    organizationId: organization.id,
    organizationName: organization.name,
    sharedTopics,
    sharedMethods,
    matchingOpportunityCount,
    reasons,
    gaps,
  };
}
