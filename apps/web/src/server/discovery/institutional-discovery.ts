import { getDb, type Prisma } from "@studepartment/db";
import type {
  InstitutionalDiscoveryQuery,
  InstitutionalDiscoveryResponse,
  InstitutionalDiscoveryResult,
  InstitutionalDiscoveryScoreBreakdown,
  InstitutionalOrganizationType,
} from "@/lib/api-contracts";
import { tokenizeDiscoveryText } from "./query";

type Candidate = {
  id: string;
  entityType: "laboratory" | "institution";
  name: string;
  organizationName?: string;
  organizationType: InstitutionalOrganizationType;
  description: string;
  countryCode: string;
  website?: string | null;
  verified: boolean;
  activeResearcherCount: number;
  labCount: number;
  topicNames: string[];
  topicSlugs: string[];
  methodNames: string[];
  methodSlugs: string[];
};

const organizationTypeToDb = {
  university: "UNIVERSITY",
  hospital: "HOSPITAL",
  "research-institute": "RESEARCH_INSTITUTE",
  company: "COMPANY",
  foundation: "FOUNDATION",
} as const;

const organizationTypeFromDb = {
  UNIVERSITY: "university",
  HOSPITAL: "hospital",
  RESEARCH_INSTITUTE: "research-institute",
  COMPANY: "company",
  FOUNDATION: "foundation",
} as const satisfies Record<string, InstitutionalOrganizationType>;

function normalize(value: string) {
  return value.toLocaleLowerCase("en").normalize("NFKC");
}

function slugify(value: string) {
  return normalize(value).replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
}

function roundSignal(value: number) {
  return Math.round(Math.max(0, Math.min(1, value)) * 1000) / 1000;
}

function overlapRatio(requested: string[], available: string[]) {
  if (!requested.length) return 0.5;
  const availableSet = new Set(available.map(normalize));
  const matches = requested.filter((item) => availableSet.has(normalize(item))).length;
  return Math.min(1, matches / requested.length);
}

function aggregate(values: Array<{ name: string; slug: string }>, limit: number) {
  const counts = new Map<string, { name: string; slug: string; count: number }>();
  for (const value of values) {
    const current = counts.get(value.slug);
    counts.set(value.slug, { ...value, count: (current?.count ?? 0) + 1 });
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function activitySignal(candidate: Candidate) {
  const people = Math.log2(candidate.activeResearcherCount + 1) / 4;
  const labs = candidate.entityType === "institution" ? Math.log2(candidate.labCount + 1) / 5 : 0;
  return roundSignal(Math.min(1, people * 0.8 + labs * 0.2));
}

function scoreCandidate(candidate: Candidate, query: InstitutionalDiscoveryQuery): InstitutionalDiscoveryResult {
  const tokens = tokenizeDiscoveryText(query.text);
  const searchable = normalize([
    candidate.name,
    candidate.organizationName ?? "",
    candidate.description,
    candidate.countryCode,
    candidate.organizationType,
    ...candidate.topicNames,
    ...candidate.topicSlugs,
    ...candidate.methodNames,
    ...candidate.methodSlugs,
  ].join(" "));
  const matchedTokens = tokens.filter((token) => searchable.includes(token));
  const text = tokens.length ? matchedTokens.length / tokens.length : 0.5;
  const topics = overlapRatio(query.topicSlugs, candidate.topicSlugs);
  const methods = overlapRatio(query.methodSlugs, candidate.methodSlugs);
  const geography = query.countryCodes.length
    ? query.countryCodes.includes(candidate.countryCode.toUpperCase()) ? 1 : 0
    : 0.5;
  const activity = activitySignal(candidate);
  const trust = candidate.verified ? 1 : 0.35;

  const scoreBreakdown: InstitutionalDiscoveryScoreBreakdown = {
    text: roundSignal(text),
    topics: roundSignal(topics),
    methods: roundSignal(methods),
    geography: roundSignal(geography),
    activity,
    trust: roundSignal(trust),
  };

  const score = roundSignal(
    text * 0.34 +
    topics * 0.20 +
    methods * 0.14 +
    geography * 0.10 +
    activity * 0.10 +
    trust * 0.12,
  );

  const matchedTopicNames = candidate.topicNames.filter((_, index) =>
    query.topicSlugs.some((slug) => normalize(slug) === normalize(candidate.topicSlugs[index] ?? "")),
  );
  const matchedMethodNames = candidate.methodNames.filter((_, index) =>
    query.methodSlugs.some((slug) => normalize(slug) === normalize(candidate.methodSlugs[index] ?? "")),
  );

  const reasons: string[] = [];
  if (matchedTokens.length) reasons.push(`Scientific intent terms: ${matchedTokens.slice(0, 4).join(", ")}`);
  if (matchedTopicNames.length) reasons.push(`Research topic match: ${matchedTopicNames.slice(0, 3).join(", ")}`);
  if (matchedMethodNames.length) reasons.push(`Method match: ${matchedMethodNames.slice(0, 3).join(", ")}`);
  if (query.countryCodes.length && geography === 1) reasons.push(`Geography match: ${candidate.countryCode}`);
  if (candidate.activeResearcherCount > 0) reasons.push(`${candidate.activeResearcherCount} public researcher${candidate.activeResearcherCount === 1 ? "" : "s"} connected to this entity`);
  if (candidate.verified) reasons.push(candidate.entityType === "institution" ? "Verified institution record" : "Verified laboratory record");
  if (!reasons.length) reasons.push(`Scientific activity represented by ${candidate.topicNames.slice(0, 2).join(" and ") || "available public research signals"}`);

  const confidence: InstitutionalDiscoveryResult["confidence"] = candidate.verified && candidate.activeResearcherCount >= 2
    ? "high"
    : candidate.verified || candidate.activeResearcherCount > 0
      ? "medium"
      : "low";

  return {
    id: candidate.id,
    entityType: candidate.entityType,
    name: candidate.name,
    organizationName: candidate.organizationName,
    organizationType: candidate.organizationType,
    description: candidate.description,
    location: candidate.countryCode || "Location not available",
    countryCode: candidate.countryCode,
    website: candidate.website,
    verified: candidate.verified,
    activeResearcherCount: candidate.activeResearcherCount,
    labCount: candidate.labCount,
    researchInterests: candidate.topicNames,
    methods: candidate.methodNames,
    confidence,
    reasons: reasons.slice(0, 4),
    score,
    scoreBreakdown,
  };
}

function hasFocusedIntent(query: InstitutionalDiscoveryQuery) {
  return Boolean(
    query.text ||
    query.topicSlugs.length ||
    query.methodSlugs.length ||
    query.countryCodes.length ||
    query.organizationTypes.length,
  );
}

function finalize(candidates: Candidate[], query: InstitutionalDiscoveryQuery): InstitutionalDiscoveryResponse {
  const results = candidates
    .map((candidate) => scoreCandidate(candidate, query))
    .filter((result) => !hasFocusedIntent(query) || result.score >= 0.26)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, query.limit);

  return {
    query,
    results,
    totalConsidered: candidates.length,
    cappedAt: query.limit,
    retrievalMode: "structured-lexical",
  };
}

function fixtureCandidates(entityType: InstitutionalDiscoveryQuery["entityType"]): Candidate[] {
  if (entityType === "laboratory") {
    return [
      {
        id: "demo-translational-oncology-lab",
        entityType: "laboratory",
        name: "Demo Translational Oncology Lab",
        organizationName: "Studepartment Demo Research Institute",
        organizationType: "research-institute",
        description: "Demonstration laboratory profile for translational oncology, biomarkers, and clinically actionable research.",
        countryCode: "DE",
        website: null,
        verified: true,
        activeResearcherCount: 6,
        labCount: 0,
        topicNames: ["Oncology", "Biomarkers", "Cancer immunotherapy"],
        topicSlugs: ["oncology", "biomarkers", "cancer-immunotherapy"],
        methodNames: ["Translational research", "Biomarker analysis"],
        methodSlugs: ["translational-research", "biomarker-analysis"],
      },
    ];
  }

  return [
    {
      id: "demo-research-institute",
      entityType: "institution",
      name: "Studepartment Demo Research Institute",
      organizationType: "research-institute",
      description: "Demonstration institution profile used when no database connection is configured.",
      countryCode: "DE",
      website: null,
      verified: true,
      activeResearcherCount: 14,
      labCount: 3,
      topicNames: ["Oncology", "Clinical trials", "Biomarkers"],
      topicSlugs: ["oncology", "clinical-trials", "biomarkers"],
      methodNames: ["Translational research", "Clinical trial design"],
      methodSlugs: ["translational-research", "clinical-trial-design"],
    },
  ];
}

function buildInstitutionWhere(query: InstitutionalDiscoveryQuery): Prisma.OrganizationWhereInput {
  const where: Prisma.OrganizationWhereInput = {};
  if (query.countryCodes.length) where.countryCode = { in: query.countryCodes };
  if (query.organizationTypes.length) {
    where.type = { in: query.organizationTypes.map((value) => organizationTypeToDb[value]) };
  }
  if (query.topicSlugs.length) {
    where.affiliations = {
      some: {
        current: true,
        researcher: {
          profilePublic: true,
          topics: { some: { topic: { slug: { in: query.topicSlugs } } } },
        },
      },
    };
  }
  if (query.methodSlugs.length) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      {
        affiliations: {
          some: {
            current: true,
            researcher: {
              profilePublic: true,
              methods: { some: { method: { slug: { in: query.methodSlugs } } } },
            },
          },
        },
      },
    ];
  }
  return where;
}

async function databaseInstitutions(query: InstitutionalDiscoveryQuery): Promise<Candidate[]> {
  const db = getDb();
  const rows = await db.organization.findMany({
    where: buildInstitutionWhere(query),
    take: Math.min(80, Math.max(30, query.limit * 7)),
    orderBy: [{ verified: "desc" }, { updatedAt: "desc" }],
    include: {
      labs: { select: { id: true } },
      affiliations: {
        where: { current: true, researcher: { profilePublic: true } },
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
  });

  return rows.map((organization) => {
    const topics = aggregate(
      organization.affiliations.flatMap(({ researcher }) => researcher.topics.map(({ topic }) => ({ name: topic.name, slug: topic.slug }))),
      6,
    );
    const methods = aggregate(
      organization.affiliations.flatMap(({ researcher }) => researcher.methods.map(({ method }) => ({ name: method.name, slug: method.slug }))),
      5,
    );
    return {
      id: organization.id,
      entityType: "institution" as const,
      name: organization.name,
      organizationType: organizationTypeFromDb[organization.type],
      description: `${organization.name} is represented by canonical affiliation and research activity data in Studepartment.`,
      countryCode: organization.countryCode ?? "",
      website: organization.website,
      verified: organization.verified,
      activeResearcherCount: organization.affiliations.length,
      labCount: organization.labs.length,
      topicNames: topics.map((topic) => topic.name),
      topicSlugs: topics.map((topic) => topic.slug),
      methodNames: methods.map((method) => method.name),
      methodSlugs: methods.map((method) => method.slug),
    };
  });
}

function buildLaboratoryWhere(query: InstitutionalDiscoveryQuery): Prisma.LaboratoryWhereInput {
  const where: Prisma.LaboratoryWhereInput = {};
  const organization: Prisma.OrganizationWhereInput = {};
  if (query.countryCodes.length) organization.countryCode = { in: query.countryCodes };
  if (query.organizationTypes.length) {
    organization.type = { in: query.organizationTypes.map((value) => organizationTypeToDb[value]) };
  }
  if (Object.keys(organization).length) where.organization = organization;
  if (query.topicSlugs.length) {
    where.members = {
      some: {
        researcher: {
          profilePublic: true,
          topics: { some: { topic: { slug: { in: query.topicSlugs } } } },
        },
      },
    };
  }
  if (query.methodSlugs.length) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      {
        members: {
          some: {
            researcher: {
              profilePublic: true,
              methods: { some: { method: { slug: { in: query.methodSlugs } } } },
            },
          },
        },
      },
    ];
  }
  return where;
}

async function databaseLaboratories(query: InstitutionalDiscoveryQuery): Promise<Candidate[]> {
  const db = getDb();
  const rows = await db.laboratory.findMany({
    where: buildLaboratoryWhere(query),
    take: Math.min(80, Math.max(30, query.limit * 7)),
    orderBy: [{ verified: "desc" }, { name: "asc" }],
    include: {
      organization: true,
      members: {
        where: { researcher: { profilePublic: true } },
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
  });

  return rows.map((laboratory) => {
    const topics = aggregate(
      laboratory.members.flatMap(({ researcher }) => researcher.topics.map(({ topic }) => ({ name: topic.name, slug: topic.slug }))),
      6,
    );
    const methods = aggregate(
      laboratory.members.flatMap(({ researcher }) => researcher.methods.map(({ method }) => ({ name: method.name, slug: method.slug }))),
      5,
    );
    return {
      id: laboratory.id,
      entityType: "laboratory" as const,
      name: laboratory.name,
      organizationName: laboratory.organization.name,
      organizationType: organizationTypeFromDb[laboratory.organization.type],
      description: laboratory.description ?? `${laboratory.name} research activity is derived from its public scientific members.`,
      countryCode: laboratory.organization.countryCode ?? "",
      website: laboratory.website,
      verified: laboratory.verified || laboratory.organization.verified,
      activeResearcherCount: laboratory.members.length,
      labCount: 0,
      topicNames: topics.map((topic) => topic.name),
      topicSlugs: topics.map((topic) => topic.slug),
      methodNames: methods.map((method) => method.name),
      methodSlugs: methods.map((method) => method.slug),
    };
  });
}

export async function discoverInstitutionalEntities(
  query: InstitutionalDiscoveryQuery,
): Promise<InstitutionalDiscoveryResponse> {
  if (!process.env.DATABASE_URL) return finalize(fixtureCandidates(query.entityType), query);
  const candidates = query.entityType === "laboratory"
    ? await databaseLaboratories(query)
    : await databaseInstitutions(query);
  return finalize(candidates, query);
}
