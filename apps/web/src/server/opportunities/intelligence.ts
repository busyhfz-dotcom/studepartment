import { getDb, type Prisma } from "@studepartment/db";
import type {
  OpportunityFreshness,
  OpportunityIntelligenceResponse,
  OpportunityQuery,
  OpportunityResult,
  OpportunityTypeValue,
} from "@/lib/api-contracts";
import { getCurrentUser } from "@/server/auth/current-user";
import { getTopInterestTopicSlugs, recordSearchAndUpdateInterest } from "@/server/personalization/interest-signals";

const typeToDb = {
  phd: "PHD",
  postdoc: "POSTDOC",
  fellowship: "FELLOWSHIP",
  grant: "GRANT",
  collaboration: "COLLABORATION",
  "research-assistantship": "RESEARCH_ASSISTANTSHIP",
} as const;

const typeFromDb = {
  PHD: "phd",
  POSTDOC: "postdoc",
  FELLOWSHIP: "fellowship",
  GRANT: "grant",
  COLLABORATION: "collaboration",
  RESEARCH_ASSISTANTSHIP: "research-assistantship",
} as const satisfies Record<string, OpportunityTypeValue>;

const sourceTypeFromDb = {
  INSTITUTIONAL_CAREERS: "institutional-careers",
  FUNDER: "funder",
  LAB_WEBSITE: "lab-website",
  RESEARCH_NETWORK: "research-network",
  MANUAL: "manual",
  IMPORT: "import",
} as const;

const deadlinePrecisionFromDb = {
  EXACT: "exact",
  DATE_ONLY: "date-only",
  MONTH_ONLY: "month-only",
  ROLLING: "rolling",
  UNKNOWN: "unknown",
} as const;

type ProfileContext = {
  careerStage?: string;
  countryCode?: string;
  topicSlugs: string[];
  methodSlugs: string[];
};

function normalize(value: string) {
  return value.toLocaleLowerCase("en").normalize("NFKC");
}

function slugify(value: string) {
  return normalize(value).replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
}

function tokenize(value: string) {
  return Array.from(new Set(
    normalize(value).split(/[^\p{L}\p{N}]+/u).map((token) => token.trim()).filter((token) => token.length >= 2),
  )).slice(0, 20);
}

function overlap(requested: string[], available: string[]) {
  if (!requested.length) return 0.5;
  const set = new Set(available.map(normalize));
  return requested.filter((item) => set.has(normalize(item))).length / requested.length;
}

function round(value: number) {
  return Math.round(Math.max(0, Math.min(1, value)) * 1000) / 1000;
}

function freshness(lastVerifiedAt: Date | null, lastSeenAt: Date): OpportunityFreshness {
  const reference = lastVerifiedAt ?? lastSeenAt;
  const days = Math.max(0, (Date.now() - reference.getTime()) / 86_400_000);
  if (days <= 7) return "fresh";
  if (days <= 30) return "aging";
  return "stale";
}

function careerAliases(value: string) {
  const slug = slugify(value);
  const aliases = new Set([slug]);
  if (slug.includes("professor") || slug.includes("faculty")) {
    aliases.add("faculty");
    aliases.add("professor");
  }
  if (slug.includes("postdoc")) aliases.add("postdoc");
  if (slug.includes("phd") || slug.includes("doctoral")) {
    aliases.add("phd");
    aliases.add("phd-student");
    aliases.add("doctoral-researcher");
  }
  if (slug.includes("early-career")) aliases.add("early-career-researcher");
  if (slug.includes("student")) aliases.add("student");
  return aliases;
}

function evaluateEligibility(
  eligibleCareerStages: string[],
  eligibleCountryCodes: string[],
  profile: ProfileContext | null,
) {
  const reasons: string[] = [];
  const gaps: string[] = [];
  let explicitRules = 0;
  let failed = false;
  let unresolved = false;

  if (eligibleCareerStages.length) {
    explicitRules += 1;
    if (!profile?.careerStage) {
      unresolved = true;
      gaps.push("Career-stage eligibility is published, but your scientific identity does not include a career stage.");
    } else {
      const aliases = careerAliases(profile.careerStage);
      const pass = eligibleCareerStages.some((stage) => aliases.has(slugify(stage)));
      if (pass) reasons.push("Career stage matches the published eligibility criteria.");
      else {
        failed = true;
        reasons.push("Career stage does not match the published eligibility criteria.");
      }
    }
  }

  if (eligibleCountryCodes.length) {
    explicitRules += 1;
    if (!profile?.countryCode) {
      unresolved = true;
      gaps.push("Geographic eligibility is published, but your scientific identity does not include a country.");
    } else {
      const pass = eligibleCountryCodes.includes(profile.countryCode.toUpperCase());
      if (pass) reasons.push("Country matches the published eligibility criteria.");
      else {
        failed = true;
        reasons.push("Country does not match the published eligibility criteria.");
      }
    }
  }

  if (!explicitRules) {
    return {
      status: "review" as const,
      reasons: ["The source does not publish enough structured eligibility criteria for an automatic determination."],
      gaps: ["Review the official eligibility requirements before investing application time."],
    };
  }
  if (failed) return { status: "unlikely" as const, reasons, gaps };
  if (unresolved) return { status: "review" as const, reasons, gaps };
  return { status: "likely" as const, reasons, gaps };
}

async function currentProfileContext(): Promise<ProfileContext | null> {
  if (!process.env.DATABASE_URL) return null;
  const user = await getCurrentUser();
  if (!user) return null;

  const profile = await getDb().researcherProfile.findUnique({
    where: { userId: user.id },
    select: {
      careerStage: true,
      countryCode: true,
      topics: { select: { topic: { select: { slug: true } } } },
      methods: { select: { method: { select: { slug: true } } } },
    },
  });

  if (!profile) return null;
  return {
    careerStage: profile.careerStage ?? undefined,
    countryCode: profile.countryCode ?? undefined,
    topicSlugs: profile.topics.map(({ topic }) => topic.slug),
    methodSlugs: profile.methods.map(({ method }) => method.slug),
  };
}

function fixtureResponse(query: OpportunityQuery): OpportunityIntelligenceResponse {
  const now = new Date();
  const deadline = new Date(now.getTime() + 45 * 86_400_000);
  return {
    query,
    totalConsidered: 1,
    cappedAt: query.limit,
    personalized: false,
    profileContext: null,
    results: [{
      id: "demo-opportunity",
      type: "postdoc",
      title: "Demo Postdoctoral Researcher · Translational Oncology",
      description: "Demonstration record used only when DATABASE_URL is not configured.",
      organization: "Studepartment Demo Research Institute",
      location: "DE",
      countryCode: "DE",
      deadline: deadline.toISOString(),
      deadlinePrecision: "date-only",
      sourceUrl: "https://example.org/demo-opportunity",
      source: { type: "manual", name: "Studepartment demo", recordId: "demo-opportunity" },
      lastVerifiedAt: now.toISOString(),
      freshness: "fresh",
      relevance: "exploratory",
      relevanceScore: 0.5,
      eligibility: "review",
      reasons: ["Demo scientific opportunity record."],
      eligibilityReasons: ["Eligibility is intentionally not inferred from demo data."],
      gaps: ["Connect a database and ingest canonical opportunity sources."],
      researchInterests: ["Oncology"],
      methods: ["Translational research"],
    }],
  };
}

export async function discoverOpportunities(query: OpportunityQuery): Promise<OpportunityIntelligenceResponse> {
  if (!process.env.DATABASE_URL) return fixtureResponse(query);

  const db = getDb();
  const profile = await currentProfileContext();
  const currentUser = await getCurrentUser();

  if (currentUser && query.text.trim()) {
    await recordSearchAndUpdateInterest(currentUser.id, query.text, "opportunities");
  }
  const interestTopicSlugs = currentUser ? await getTopInterestTopicSlugs(currentUser.id) : [];

  const now = new Date();
  const staleCutoff = new Date(now.getTime() - 45 * 86_400_000);
  const where: Prisma.OpportunityWhereInput = {
    ...(query.id ? { id: query.id } : {}),
    status: "ACTIVE",
    OR: [{ deadline: null }, { deadline: { gte: now } }],
  };

  if (!query.includeStale) where.lastSeenAt = { gte: staleCutoff };
  if (query.types.length) where.type = { in: query.types.map((type) => typeToDb[type]) };
  if (query.countryCodes.length) where.countryCode = { in: query.countryCodes };
  if (query.topicSlugs.length) {
    where.topics = { some: { topic: { slug: { in: query.topicSlugs } } } };
  }
  if (query.methodSlugs.length) {
    where.methods = { some: { method: { slug: { in: query.methodSlugs } } } };
  }
  if (query.deadlineWithinDays) {
    where.deadline = {
      gte: now,
      lte: new Date(now.getTime() + query.deadlineWithinDays * 86_400_000),
    };
  }

  const rows = await db.opportunity.findMany({
    where,
    take: Math.min(150, Math.max(50, query.limit * 8)),
    orderBy: [{ lastVerifiedAt: "desc" }, { deadline: "asc" }],
    include: {
      organization: true,
      topics: { include: { topic: true }, orderBy: { weight: "desc" } },
      methods: { include: { method: true } },
    },
  });

  const requestedTopics = query.topicSlugs.length
    ? query.topicSlugs
    : Array.from(new Set([...(profile?.topicSlugs ?? []), ...interestTopicSlugs]));
  const requestedMethods = query.methodSlugs.length ? query.methodSlugs : profile?.methodSlugs ?? [];
  const behaviorMatchedTopics = new Set(interestTopicSlugs);
  const tokens = tokenize(query.text);

  const scored = rows.map((opportunity): OpportunityResult => {
    const topicSlugs = opportunity.topics.map(({ topic }) => topic.slug);
    const methodSlugs = opportunity.methods.map(({ method }) => method.slug);
    const searchable = normalize([
      opportunity.title,
      opportunity.description ?? "",
      opportunity.organization.name,
      opportunity.city ?? "",
      opportunity.countryCode ?? "",
      ...opportunity.topics.map(({ topic }) => topic.name),
      ...opportunity.methods.map(({ method }) => method.name),
    ].join(" "));

    const matchedTokens = tokens.filter((token) => searchable.includes(token));
    const textScore = tokens.length ? matchedTokens.length / tokens.length : 0.5;
    const topicScore = overlap(requestedTopics, topicSlugs);
    const methodScore = overlap(requestedMethods, methodSlugs);
    const relevanceScore = round(textScore * 0.30 + topicScore * 0.45 + methodScore * 0.25);
    const relevance: OpportunityResult["relevance"] = relevanceScore >= 0.72
      ? "strong"
      : relevanceScore >= 0.48
        ? "relevant"
        : "exploratory";

    const reasons: string[] = [];
    const matchedTopicNames = opportunity.topics
      .filter(({ topic }) => requestedTopics.includes(topic.slug))
      .map(({ topic }) => topic.name);
    const matchedMethodNames = opportunity.methods
      .filter(({ method }) => requestedMethods.includes(method.slug))
      .map(({ method }) => method.name);

    if (matchedTopicNames.length) reasons.push(`Research topic alignment: ${matchedTopicNames.slice(0, 3).join(", ")}`);
    if (matchedMethodNames.length) reasons.push(`Method alignment: ${matchedMethodNames.slice(0, 3).join(", ")}`);
    if (matchedTokens.length) reasons.push(`Search intent terms: ${matchedTokens.slice(0, 4).join(", ")}`);
    const behaviorMatchedNames = opportunity.topics
      .filter(({ topic }) => behaviorMatchedTopics.has(topic.slug) && !matchedTopicNames.includes(topic.name))
      .map(({ topic }) => topic.name);
    if (behaviorMatchedNames.length) reasons.push(`Based on your recent searches: ${behaviorMatchedNames.slice(0, 3).join(", ")}`);
    if (!reasons.length) reasons.push("Opportunity is within the current structured filters but has limited scientific-profile evidence.");

    const eligibility = evaluateEligibility(
      opportunity.eligibleCareerStages,
      opportunity.eligibleCountryCodes,
      profile,
    );

    return {
      id: opportunity.id,
      type: typeFromDb[opportunity.type],
      title: opportunity.title,
      description: opportunity.description ?? undefined,
      organization: opportunity.organization.name,
      location: [opportunity.city, opportunity.countryCode].filter(Boolean).join(" · ") || "Location not published",
      countryCode: opportunity.countryCode ?? undefined,
      deadline: opportunity.deadline?.toISOString(),
      deadlinePrecision: deadlinePrecisionFromDb[opportunity.deadlinePrecision],
      sourceUrl: opportunity.sourceUrl,
      applicationUrl: opportunity.applicationUrl ?? undefined,
      source: {
        type: sourceTypeFromDb[opportunity.sourceType],
        name: opportunity.sourceName,
        recordId: opportunity.sourceRecordId,
      },
      lastVerifiedAt: (opportunity.lastVerifiedAt ?? opportunity.lastSeenAt).toISOString(),
      freshness: freshness(opportunity.lastVerifiedAt, opportunity.lastSeenAt),
      relevance,
      relevanceScore,
      eligibility: eligibility.status,
      reasons: reasons.slice(0, 4),
      eligibilityReasons: eligibility.reasons,
      gaps: eligibility.gaps,
      researchInterests: opportunity.topics.map(({ topic }) => topic.name),
      methods: opportunity.methods.map(({ method }) => method.name),
    };
  });

  scored.sort((a, b) => {
    if (a.relevanceScore !== b.relevanceScore) return b.relevanceScore - a.relevanceScore;
    if (a.freshness !== b.freshness) {
      const order = { fresh: 0, aging: 1, stale: 2 } as const;
      return order[a.freshness] - order[b.freshness];
    }
    return (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999");
  });

  return {
    query,
    results: scored.slice(0, query.limit),
    totalConsidered: rows.length,
    cappedAt: query.limit,
    personalized: Boolean(profile) || interestTopicSlugs.length > 0,
    profileContext: profile,
  };
}
