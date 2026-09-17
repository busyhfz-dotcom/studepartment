import { getDb, type Prisma } from "@studepartment/db";
import type {
  DiscoveryAvailability,
  DiscoveryScoreBreakdown,
  ResearcherDiscoveryQuery,
  ResearcherDiscoveryResponse,
  ResearcherDiscoveryResult,
} from "@/lib/api-contracts";
import { researcherPreviews } from "@/lib/scientific-data";
import { tokenizeDiscoveryText } from "./query";

const availabilityToDb = {
  open: "OPEN",
  selective: "SELECTIVE",
  quiet: "QUIET",
  closed: "CLOSED",
} as const;

const availabilityFromDb = {
  OPEN: "open",
  SELECTIVE: "selective",
  QUIET: "quiet",
  CLOSED: "closed",
} as const satisfies Record<string, DiscoveryAvailability>;

type CandidateSignals = {
  id: string;
  fullName: string;
  headline: string;
  bio: string;
  institution: string;
  organizationVerified: boolean;
  city: string;
  countryCode: string;
  careerStage: string;
  availability: DiscoveryAvailability;
  topicNames: string[];
  topicSlugs: string[];
  methodNames: string[];
  methodSlugs: string[];
  verifiedSignals: string[];
};

function normalize(value: string) {
  return value.toLocaleLowerCase("en").normalize("NFKC");
}

function overlapRatio(requested: string[], available: string[]) {
  if (!requested.length) return 0.5;
  const availableSet = new Set(available.map(normalize));
  const matches = requested.filter((item) => availableSet.has(normalize(item))).length;
  return Math.min(1, matches / requested.length);
}

function availabilityUtility(value: DiscoveryAvailability) {
  if (value === "open") return 1;
  if (value === "selective") return 0.72;
  if (value === "quiet") return 0.25;
  return 0;
}

function roundSignal(value: number) {
  return Math.round(Math.max(0, Math.min(1, value)) * 1000) / 1000;
}

function scoreCandidate(candidate: CandidateSignals, query: ResearcherDiscoveryQuery): ResearcherDiscoveryResult {
  const tokens = tokenizeDiscoveryText(query.text);
  const searchable = normalize(
    [
      candidate.fullName,
      candidate.headline,
      candidate.bio,
      candidate.institution,
      candidate.city,
      candidate.countryCode,
      candidate.careerStage,
      ...candidate.topicNames,
      ...candidate.topicSlugs,
      ...candidate.methodNames,
      ...candidate.methodSlugs,
    ].join(" "),
  );
  const matchedTokens = tokens.filter((token) => searchable.includes(token));
  const text = tokens.length ? matchedTokens.length / tokens.length : 0.5;
  const topics = overlapRatio(query.topicSlugs, candidate.topicSlugs);
  const methods = overlapRatio(query.methodSlugs, candidate.methodSlugs);
  const geography = query.countryCodes.length
    ? query.countryCodes.includes(candidate.countryCode.toUpperCase()) ? 1 : 0
    : 0.5;
  const availability = query.availability.length
    ? query.availability.includes(candidate.availability) ? 1 : 0
    : availabilityUtility(candidate.availability);
  const trust = Math.min(1, candidate.verifiedSignals.length / 4);

  const scoreBreakdown: DiscoveryScoreBreakdown = {
    text: roundSignal(text),
    topics: roundSignal(topics),
    methods: roundSignal(methods),
    geography: roundSignal(geography),
    availability: roundSignal(availability),
    trust: roundSignal(trust),
  };

  const score = roundSignal(
    text * 0.30 +
    topics * 0.25 +
    methods * 0.15 +
    geography * 0.10 +
    availability * 0.10 +
    trust * 0.10,
  );

  const matchedTopics = candidate.topicNames.filter((_, index) =>
    query.topicSlugs.some((slug) => normalize(slug) === normalize(candidate.topicSlugs[index] ?? "")),
  );
  const matchedMethods = candidate.methodNames.filter((_, index) =>
    query.methodSlugs.some((slug) => normalize(slug) === normalize(candidate.methodSlugs[index] ?? "")),
  );

  const reasons: string[] = [];
  if (matchedTokens.length) reasons.push(`Scientific intent terms: ${matchedTokens.slice(0, 4).join(", ")}`);
  if (matchedTopics.length) reasons.push(`Research topic match: ${matchedTopics.slice(0, 3).join(", ")}`);
  if (matchedMethods.length) reasons.push(`Method match: ${matchedMethods.slice(0, 3).join(", ")}`);
  if (query.countryCodes.length && geography === 1) reasons.push(`Geography match: ${candidate.city || candidate.countryCode}`);
  if (candidate.availability === "open") reasons.push("Currently open to scientific introductions");
  else if (candidate.availability === "selective") reasons.push("Selective availability for relevant introductions");
  if (candidate.verifiedSignals.length) reasons.push(`Verified signals: ${candidate.verifiedSignals.slice(0, 3).join(", ")}`);
  if (!reasons.length) reasons.push(`${candidate.careerStage} at ${candidate.institution}`);

  const alignment: ResearcherDiscoveryResult["alignment"] = score >= 0.75
    ? "strong"
    : score >= 0.5
      ? "relevant"
      : "complementary";
  const confidence: ResearcherDiscoveryResult["confidence"] = trust >= 0.75
    ? "high"
    : trust >= 0.25
      ? "medium"
      : "low";

  return {
    id: candidate.id,
    fullName: candidate.fullName,
    headline: candidate.headline,
    institution: candidate.institution,
    location: [candidate.city, candidate.countryCode].filter(Boolean).join(" · ") || "Location not shared",
    careerStage: candidate.careerStage,
    researchInterests: candidate.topicNames,
    methods: candidate.methodNames,
    alignment,
    reasons: reasons.slice(0, 4),
    availability: candidate.availability,
    confidence,
    verifiedSignals: candidate.verifiedSignals,
    score,
    scoreBreakdown,
  };
}

function hasFocusedIntent(query: ResearcherDiscoveryQuery) {
  return Boolean(
    query.text ||
    query.topicSlugs.length ||
    query.methodSlugs.length ||
    query.countryCodes.length ||
    query.careerStages.length ||
    query.availability.length,
  );
}

function finalizeResults(candidates: CandidateSignals[], query: ResearcherDiscoveryQuery): ResearcherDiscoveryResponse {
  const scored = candidates
    .map((candidate) => scoreCandidate(candidate, query))
    .filter((result) => !hasFocusedIntent(query) || result.score >= 0.28)
    .sort((a, b) => b.score - a.score || a.fullName.localeCompare(b.fullName));

  return {
    query,
    results: scored.slice(0, query.limit),
    totalConsidered: candidates.length,
    cappedAt: query.limit,
  };
}

function fixtureCandidates(): CandidateSignals[] {
  return researcherPreviews.map((researcher) => ({
    id: researcher.id,
    fullName: researcher.name,
    headline: researcher.title,
    bio: "",
    institution: researcher.institution,
    organizationVerified: researcher.verified,
    city: researcher.location.split(",")[0]?.trim() ?? "",
    countryCode: researcher.location.split(",").at(-1)?.trim().slice(0, 2).toUpperCase() ?? "",
    careerStage: researcher.title.includes("Professor") ? "Professor" : "Researcher",
    availability: researcher.openTo.length ? "open" : "selective",
    topicNames: researcher.topics,
    topicSlugs: researcher.topics.map((topic) => normalize(topic).replaceAll(" ", "-")),
    methodNames: researcher.methods,
    methodSlugs: researcher.methods.map((method) => normalize(method).replaceAll(" ", "-")),
    verifiedSignals: researcher.verified ? ["Profile", "Institution"] : [],
  }));
}

async function databaseCandidates(query: ResearcherDiscoveryQuery): Promise<CandidateSignals[]> {
  const db = getDb();
  const where: Prisma.ResearcherProfileWhereInput = { profilePublic: true };

  if (query.topicSlugs.length) {
    where.topics = { some: { topic: { slug: { in: query.topicSlugs } } } };
  }
  if (query.methodSlugs.length) {
    where.methods = { some: { method: { slug: { in: query.methodSlugs } } } };
  }
  if (query.countryCodes.length) {
    where.countryCode = { in: query.countryCodes };
  }
  if (query.careerStages.length) {
    where.careerStage = { in: query.careerStages };
  }
  if (query.availability.length) {
    where.availabilityMode = { in: query.availability.map((value) => availabilityToDb[value]) };
  }

  const rows = await db.researcherProfile.findMany({
    where,
    take: Math.min(100, Math.max(40, query.limit * 8)),
    orderBy: [{ verified: "desc" }, { updatedAt: "desc" }],
    include: {
      user: { select: { emailVerified: true } },
      affiliations: {
        where: { current: true },
        include: { organization: true },
        orderBy: { startDate: "desc" },
        take: 1,
      },
      topics: { include: { topic: true }, orderBy: { weight: "desc" } },
      methods: { include: { method: true } },
      publications: { select: { publicationId: true }, take: 1 },
      evidence: {
        where: { status: "VERIFIED" },
        select: { sourceType: true, fieldPath: true },
      },
    },
  });

  return rows.map((researcher) => {
    const affiliation = researcher.affiliations[0];
    const verifiedSignals = new Set<string>();
    if (researcher.verified) verifiedSignals.add("Profile");
    if (affiliation?.organization.verified) verifiedSignals.add("Institution");
    if (researcher.publications.length) verifiedSignals.add("Publications");
    if (researcher.user?.emailVerified) verifiedSignals.add("Email");
    if (researcher.evidence.some((record) => record.sourceType === "ORCID" && record.fieldPath === "orcid")) {
      verifiedSignals.add("ORCID");
    }

    return {
      id: researcher.id,
      fullName: researcher.fullName,
      headline: researcher.headline ?? "Medical researcher",
      bio: researcher.bio ?? "",
      institution: affiliation?.organization.name ?? "Independent researcher",
      organizationVerified: Boolean(affiliation?.organization.verified),
      city: researcher.city ?? "",
      countryCode: researcher.countryCode ?? affiliation?.organization.countryCode ?? "",
      careerStage: researcher.careerStage ?? "Researcher",
      availability: availabilityFromDb[researcher.availabilityMode],
      topicNames: researcher.topics.map(({ topic }) => topic.name),
      topicSlugs: researcher.topics.map(({ topic }) => topic.slug),
      methodNames: researcher.methods.map(({ method }) => method.name),
      methodSlugs: researcher.methods.map(({ method }) => method.slug),
      verifiedSignals: Array.from(verifiedSignals),
    };
  });
}

export async function discoverResearchers(query: ResearcherDiscoveryQuery): Promise<ResearcherDiscoveryResponse> {
  if (!process.env.DATABASE_URL) {
    return finalizeResults(fixtureCandidates(), query);
  }

  const candidates = await databaseCandidates(query);
  return finalizeResults(candidates, query);
}
