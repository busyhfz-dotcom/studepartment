import { getDb } from "@studepartment/db";
import type {
  ResearchAssistantCitation,
  ResearchAssistantTarget,
} from "@/lib/api-contracts";
import { requireCurrentUser } from "@/server/auth/current-user";
import { getInstitutionalIntelligence } from "@/server/institutions/intelligence";

export class ResearchAssistantContextError extends Error {
  constructor(readonly code: string, message: string, readonly status = 400) {
    super(message);
    this.name = "ResearchAssistantContextError";
  }
}

type ContextResult = {
  context: string;
  citations: ResearchAssistantCitation[];
  target?: ResearchAssistantTarget;
  limitations: string[];
};

function trimList(values: string[], max = 6) {
  return values.filter(Boolean).slice(0, max);
}

function isoDate(value?: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "not published";
}

function evidenceForPublication(level: string): ResearchAssistantCitation["evidence"] {
  if (level === "PUBMED_CORROBORATED") return "corroborated";
  if (level === "ORCID_ASSERTED") return "source-backed";
  return "asserted";
}

function sourceLine(citation: ResearchAssistantCitation) {
  return [
    "[" + citation.id + "]",
    "TYPE=" + citation.type,
    "LABEL=" + citation.label,
    "EVIDENCE=" + citation.evidence,
    "DETAIL=" + citation.detail.replace(/\s+/g, " ").trim(),
    citation.href ? "HREF=" + citation.href : "",
  ].filter(Boolean).join("; ");
}

export async function buildResearchAssistantContext(
  target?: ResearchAssistantTarget,
  authenticatedUserId?: string,
): Promise<ContextResult> {
  const userId = authenticatedUserId ?? (await requireCurrentUser()).id;
  const db = getDb();
  const profile = await db.researcherProfile.findUnique({
    where: { userId },
    include: {
      affiliations: {
        where: { current: true },
        orderBy: { startDate: "desc" },
        take: 2,
        include: { organization: true },
      },
      topics: {
        orderBy: { weight: "desc" },
        include: { topic: true },
        take: 12,
      },
      methods: {
        include: { method: true },
        take: 12,
      },
      publications: {
        where: { active: true },
        orderBy: { publication: { publicationDate: "desc" } },
        take: 5,
        include: { publication: true },
      },
    },
  });

  if (!profile) {
    throw new ResearchAssistantContextError(
      "SCIENTIFIC_IDENTITY_REQUIRED",
      "Complete your Scientific Identity before using the Research Assistant.",
      409,
    );
  }

  const citations: ResearchAssistantCitation[] = [];
  function add(citation: Omit<ResearchAssistantCitation, "id">) {
    if (citations.length >= 28) return null;
    const full = { id: "S" + (citations.length + 1), ...citation };
    citations.push(full);
    return full.id;
  }

  const topicNames = profile.topics.map((relation) => relation.topic.name);
  const methodNames = profile.methods.map((relation) => relation.method.name);
  const topicIds = profile.topics.map((relation) => relation.topicId);
  const methodIds = profile.methods.map((relation) => relation.methodId);
  const affiliations = profile.affiliations.map((relation) => relation.organization.name);

  add({
    type: "identity",
    label: "Your Scientific Identity",
    evidence: profile.verified ? "verified" : "asserted",
    href: "/profile",
    detail: [
      "Name: " + profile.fullName + ".",
      profile.careerStage ? "Career stage: " + profile.careerStage + "." : "",
      affiliations.length ? "Current affiliation: " + affiliations.join(", ") + "." : "No current affiliation is recorded.",
      topicNames.length ? "Research topics: " + trimList(topicNames, 10).join(", ") + "." : "No canonical research topics are recorded.",
      methodNames.length ? "Methods: " + trimList(methodNames, 10).join(", ") + "." : "No canonical research methods are recorded.",
      profile.collaborationGoals.length ? "Collaboration goals: " + profile.collaborationGoals.join(", ") + "." : "",
      "Availability: " + profile.availabilityMode.toLowerCase() + ".",
    ].filter(Boolean).join(" "),
  });

  for (const relation of profile.publications) {
    const publication = relation.publication;
    add({
      type: "publication",
      label: publication.title,
      evidence: evidenceForPublication(relation.evidenceLevel),
      href: publication.sourceUrl ?? (publication.pmid ? "https://pubmed.ncbi.nlm.nih.gov/" + publication.pmid + "/" : undefined),
      detail: [
        publication.journal ? "Journal: " + publication.journal + "." : "",
        "Publication date: " + isoDate(publication.publicationDate) + ".",
        publication.pmid ? "PMID: " + publication.pmid + "." : "",
        publication.doi ? "DOI: " + publication.doi + "." : "",
        "Authorship evidence: " + relation.evidenceLevel.toLowerCase().replaceAll("_", " ") + ".",
      ].filter(Boolean).join(" "),
    });
  }

  if (target?.type === "institution") {
    const institution = await getInstitutionalIntelligence(target.id);
    if (!institution) {
      throw new ResearchAssistantContextError("TARGET_NOT_FOUND", "Institution target not found.", 404);
    }
    add({
      type: "institution",
      label: institution.name,
      evidence: institution.verified ? "verified" : "source-backed",
      href: "/institutions/" + institution.id,
      detail: [
        "Organization type: " + institution.type + ".",
        institution.countryCode ? "Country: " + institution.countryCode + "." : "",
        "Public current researchers: " + institution.researchers.length + ".",
        "Canonical laboratories: " + institution.labs.length + ".",
        institution.topics.length ? "Research concentrations: " + institution.topics.slice(0, 8).map((item) => item.name + " (" + item.researcherCount + ")").join(", ") + "." : "",
        institution.methods.length ? "Method capabilities: " + institution.methods.slice(0, 8).map((item) => item.name + " (" + item.researcherCount + ")").join(", ") + "." : "",
        "Current source-backed opportunities: " + institution.opportunities.length + ".",
      ].filter(Boolean).join(" "),
    });

    for (const lab of institution.labs.slice(0, 4)) {
      add({
        type: "laboratory",
        label: lab.name,
        evidence: lab.verified ? "verified" : "source-backed",
        href: lab.website ?? undefined,
        detail: [
          "Institution: " + institution.name + ".",
          "Recorded members: " + lab.memberCount + ".",
          lab.description ? "Description: " + lab.description : "",
        ].filter(Boolean).join(" "),
      });
    }
  }

  if (target?.type === "researcher") {
    const researcher = await db.researcherProfile.findUnique({
      where: { id: target.id },
      include: {
        affiliations: { where: { current: true }, take: 1, include: { organization: true } },
        topics: { orderBy: { weight: "desc" }, take: 10, include: { topic: true } },
        methods: { take: 10, include: { method: true } },
      },
    });
    if (!researcher || (!researcher.profilePublic && researcher.userId !== userId)) {
      throw new ResearchAssistantContextError("TARGET_NOT_FOUND", "Researcher target not found.", 404);
    }
    add({
      type: "researcher",
      label: researcher.fullName,
      evidence: researcher.verified ? "verified" : "source-backed",
      href: "/researchers/" + researcher.id,
      detail: [
        researcher.headline ? "Headline: " + researcher.headline + "." : "",
        researcher.affiliations[0] ? "Current institution: " + researcher.affiliations[0].organization.name + "." : "",
        "Availability: " + researcher.availabilityMode.toLowerCase() + ".",
        researcher.topics.length ? "Research topics: " + researcher.topics.map((item) => item.topic.name).join(", ") + "." : "",
        researcher.methods.length ? "Methods: " + researcher.methods.map((item) => item.method.name).join(", ") + "." : "",
        researcher.collaborationGoals.length ? "Collaboration goals: " + researcher.collaborationGoals.join(", ") + "." : "",
      ].filter(Boolean).join(" "),
    });
  }

  if (target?.type === "opportunity") {
    const opportunity = await db.opportunity.findUnique({
      where: { id: target.id },
      include: {
        organization: true,
        topics: { include: { topic: true } },
        methods: { include: { method: true } },
      },
    });
    if (!opportunity) {
      throw new ResearchAssistantContextError("TARGET_NOT_FOUND", "Opportunity target not found.", 404);
    }
    add({
      type: "opportunity",
      label: opportunity.title,
      evidence: opportunity.lastVerifiedAt ? "source-backed" : "asserted",
      href: opportunity.sourceUrl,
      detail: [
        "Organization: " + opportunity.organization.name + ".",
        "Type: " + opportunity.type.toLowerCase().replaceAll("_", " ") + ".",
        opportunity.countryCode ? "Country: " + opportunity.countryCode + "." : "",
        "Status: " + opportunity.status.toLowerCase() + ".",
        opportunity.deadline ? "Deadline: " + opportunity.deadline.toISOString() + "." : "Deadline is not exact.",
        opportunity.topics.length ? "Topics: " + opportunity.topics.map((item) => item.topic.name).join(", ") + "." : "",
        opportunity.methods.length ? "Methods: " + opportunity.methods.map((item) => item.method.name).join(", ") + "." : "",
        opportunity.eligibleCareerStages.length ? "Published career-stage criteria: " + opportunity.eligibleCareerStages.join(", ") + "." : "No structured career-stage criteria are recorded.",
        opportunity.eligibleCountryCodes.length ? "Published country criteria: " + opportunity.eligibleCountryCodes.join(", ") + "." : "No structured country criteria are recorded.",
        "Source: " + opportunity.sourceName + ".",
      ].filter(Boolean).join(" "),
    });
  }

  const overlapFilters = [
    ...(topicIds.length ? [{ topics: { some: { topicId: { in: topicIds } } } }] : []),
    ...(methodIds.length ? [{ methods: { some: { methodId: { in: methodIds } } } }] : []),
  ];

  if (overlapFilters.length) {
    const researchers = await db.researcherProfile.findMany({
      where: {
        profilePublic: true,
        id: { not: profile.id },
        OR: overlapFilters,
      },
      orderBy: [{ verified: "desc" }, { updatedAt: "desc" }],
      take: 5,
      include: {
        affiliations: { where: { current: true }, take: 1, include: { organization: true } },
        topics: { where: { topicId: { in: topicIds } }, include: { topic: true }, take: 6 },
        methods: { where: { methodId: { in: methodIds } }, include: { method: true }, take: 6 },
      },
    });

    for (const researcher of researchers) {
      add({
        type: "researcher",
        label: researcher.fullName,
        evidence: researcher.verified ? "verified" : "source-backed",
        href: "/researchers/" + researcher.id,
        detail: [
          researcher.headline ? "Headline: " + researcher.headline + "." : "",
          researcher.affiliations[0] ? "Institution: " + researcher.affiliations[0].organization.name + "." : "",
          researcher.topics.length ? "Shared topics: " + researcher.topics.map((item) => item.topic.name).join(", ") + "." : "",
          researcher.methods.length ? "Shared methods: " + researcher.methods.map((item) => item.method.name).join(", ") + "." : "",
          "Availability: " + researcher.availabilityMode.toLowerCase() + ".",
        ].filter(Boolean).join(" "),
      });
    }

    const institutions = await db.organization.findMany({
      where: {
        affiliations: {
          some: {
            current: true,
            researcher: {
              profilePublic: true,
              OR: overlapFilters,
            },
          },
        },
      },
      orderBy: [{ verified: "desc" }, { name: "asc" }],
      take: 5,
      include: {
        _count: { select: { affiliations: true, labs: true } },
      },
    });

    for (const institution of institutions) {
      if (target?.type === "institution" && target.id === institution.id) continue;
      add({
        type: "institution",
        label: institution.name,
        evidence: institution.verified ? "verified" : "source-backed",
        href: "/institutions/" + institution.id,
        detail: [
          "Organization type: " + institution.type.toLowerCase().replaceAll("_", " ") + ".",
          institution.countryCode ? "Country: " + institution.countryCode + "." : "",
          "Recorded affiliations: " + institution._count.affiliations + ".",
          "Canonical labs: " + institution._count.labs + ".",
          "Included because at least one public current researcher overlaps your canonical topics or methods.",
        ].filter(Boolean).join(" "),
      });
    }

    const opportunities = await db.opportunity.findMany({
      where: {
        status: "ACTIVE",
        OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
        AND: [{ OR: overlapFilters }],
      },
      orderBy: [{ lastVerifiedAt: "desc" }, { deadline: "asc" }],
      take: 6,
      include: {
        organization: true,
        topics: { where: { topicId: { in: topicIds } }, include: { topic: true }, take: 5 },
        methods: { where: { methodId: { in: methodIds } }, include: { method: true }, take: 5 },
      },
    });

    for (const opportunity of opportunities) {
      if (target?.type === "opportunity" && target.id === opportunity.id) continue;
      add({
        type: "opportunity",
        label: opportunity.title,
        evidence: opportunity.lastVerifiedAt ? "source-backed" : "asserted",
        href: opportunity.sourceUrl,
        detail: [
          "Organization: " + opportunity.organization.name + ".",
          "Type: " + opportunity.type.toLowerCase().replaceAll("_", " ") + ".",
          opportunity.deadline ? "Deadline: " + opportunity.deadline.toISOString() + "." : "Deadline is not exact.",
          opportunity.topics.length ? "Shared topics: " + opportunity.topics.map((item) => item.topic.name).join(", ") + "." : "",
          opportunity.methods.length ? "Shared methods: " + opportunity.methods.map((item) => item.method.name).join(", ") + "." : "",
          "Source: " + opportunity.sourceName + ".",
        ].filter(Boolean).join(" "),
      });
    }
  }

  return {
    context: citations.map(sourceLine).join("\n"),
    citations,
    target,
    limitations: [
      "The assistant only receives the canonical Studepartment context listed in the source ledger for this request.",
      "Scientific relevance is not formal eligibility, hiring probability, institutional quality, or researcher reputation.",
      "The assistant is for research navigation and does not provide patient-specific diagnosis or treatment advice.",
    ],
  };
}
