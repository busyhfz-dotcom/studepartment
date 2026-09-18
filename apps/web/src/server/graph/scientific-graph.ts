import { getDb } from "@studepartment/db";
import type {
  ScientificGraphEdge,
  ScientificGraphEvidence,
  ScientificGraphNeighborhoodResponse,
  ScientificGraphNode,
  ScientificGraphNodeType,
} from "@/lib/api-contracts";
import { getCurrentUser } from "@/server/auth/current-user";

const LIMITS = {
  nodes: 80,
  edges: 180,
  publications: 20,
  opportunities: 12,
} as const;

export class ScientificGraphNotFoundError extends Error {
  readonly code = "SCIENTIFIC_GRAPH_NOT_FOUND";
  constructor(message = "Scientific graph researcher not found.") {
    super(message);
    this.name = "ScientificGraphNotFoundError";
  }
}

export class ScientificGraphForbiddenError extends Error {
  readonly code = "SCIENTIFIC_GRAPH_FORBIDDEN";
  constructor(message = "This scientific graph is not public.") {
    super(message);
    this.name = "ScientificGraphForbiddenError";
  }
}

export class ScientificGraphIdentityRequiredError extends Error {
  readonly code = "SCIENTIFIC_IDENTITY_REQUIRED";
  constructor() {
    super("A scientific identity is required to open your evidence graph.");
    this.name = "ScientificGraphIdentityRequiredError";
  }
}

function graphId(type: ScientificGraphNodeType, entityId: string) {
  return type + ":" + entityId;
}

function verifiedEvidence(source: string, detail?: string): ScientificGraphEvidence {
  return { level: "verified", source, detail };
}

function sourceEvidence(source: string, detail?: string): ScientificGraphEvidence {
  return { level: "source-backed", source, detail };
}

function assertedEvidence(source: string, detail?: string): ScientificGraphEvidence {
  return { level: "asserted", source, detail };
}

function publicationEvidence(level: "MANUAL_ASSERTED" | "ORCID_ASSERTED" | "PUBMED_CORROBORATED"): ScientificGraphEvidence {
  if (level === "PUBMED_CORROBORATED") {
    return { level: "corroborated", source: "ORCID + PubMed", detail: "Authorship relationship corroborated by PubMed metadata." };
  }
  if (level === "ORCID_ASSERTED") {
    return { level: "source-backed", source: "ORCID", detail: "Work is asserted on the researcher's verified ORCID record." };
  }
  return { level: "asserted", source: "Manual", detail: "Publication relationship was entered manually." };
}

function opportunityEvidence(sourceName: string, lastVerifiedAt: Date | null): ScientificGraphEvidence {
  return lastVerifiedAt
    ? sourceEvidence(sourceName, "Opportunity source was explicitly verified.")
    : assertedEvidence(sourceName, "Opportunity is source-linked but not explicitly verified.");
}

function opportunityTypeLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function buildScientificGraph(requestedResearcherId?: string): Promise<ScientificGraphNeighborhoodResponse> {
  const db = getDb();
  const currentUser = await getCurrentUser();
  let researcherId = requestedResearcherId?.trim();

  if (!researcherId) {
    if (!currentUser) throw new ScientificGraphIdentityRequiredError();
    const owned = await db.researcherProfile.findUnique({
      where: { userId: currentUser.id },
      select: { id: true },
    });
    if (!owned) throw new ScientificGraphIdentityRequiredError();
    researcherId = owned.id;
  }

  const researcher = await db.researcherProfile.findUnique({
    where: { id: researcherId },
    include: {
      user: { select: { id: true } },
      affiliations: {
        where: { current: true },
        orderBy: { startDate: "desc" },
        include: { organization: true },
        take: 3,
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
        take: LIMITS.publications,
        include: { publication: true },
      },
      labMemberships: {
        include: {
          laboratory: { include: { organization: true } },
        },
        take: 8,
      },
    },
  });

  if (!researcher) throw new ScientificGraphNotFoundError();

  const isOwner = Boolean(currentUser && researcher.userId === currentUser.id);
  if (!researcher.profilePublic && !isOwner) {
    throw new ScientificGraphForbiddenError();
  }

  const organizationIds = Array.from(new Set([
    ...researcher.affiliations.map((affiliation) => affiliation.organizationId),
    ...researcher.labMemberships.map((membership) => membership.laboratory.organizationId),
  ]));

  const opportunities = organizationIds.length
    ? await db.opportunity.findMany({
        where: {
          organizationId: { in: organizationIds },
          status: "ACTIVE",
          OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
        },
        orderBy: [{ lastVerifiedAt: "desc" }, { deadline: "asc" }],
        take: LIMITS.opportunities,
        include: {
          organization: true,
          topics: { include: { topic: true }, orderBy: { weight: "desc" }, take: 8 },
          methods: { include: { method: true }, take: 8 },
        },
      })
    : [];

  const nodes = new Map<string, ScientificGraphNode>();
  const edges = new Map<string, ScientificGraphEdge>();
  let truncated = false;

  function addNode(node: ScientificGraphNode) {
    if (nodes.has(node.id)) return true;
    if (nodes.size >= LIMITS.nodes) {
      truncated = true;
      return false;
    }
    nodes.set(node.id, node);
    return true;
  }

  function addEdge(edge: ScientificGraphEdge) {
    if (edges.has(edge.id)) return true;
    if (!nodes.has(edge.source) || !nodes.has(edge.target)) return false;
    if (edges.size >= LIMITS.edges) {
      truncated = true;
      return false;
    }
    edges.set(edge.id, edge);
    return true;
  }

  const researcherNodeId = graphId("researcher", researcher.id);
  addNode({
    id: researcherNodeId,
    entityId: researcher.id,
    type: "researcher",
    label: researcher.fullName,
    subtitle: researcher.headline ?? researcher.careerStage ?? "Medical researcher",
    href: "/researchers/" + researcher.id,
    evidence: researcher.verified
      ? verifiedEvidence("Scientific Identity", "Profile carries a verified identity signal.")
      : sourceEvidence("Scientific Identity", "Canonical Studepartment researcher profile."),
    metadata: {
      careerStage: researcher.careerStage ?? null,
      countryCode: researcher.countryCode ?? null,
      public: researcher.profilePublic,
      ownerView: isOwner,
    },
  });

  for (const affiliation of researcher.affiliations) {
    const organization = affiliation.organization;
    const nodeId = graphId("institution", organization.id);
    addNode({
      id: nodeId,
      entityId: organization.id,
      type: "institution",
      label: organization.name,
      subtitle: opportunityTypeLabel(organization.type),
      href: organization.website ?? undefined,
      evidence: organization.verified
        ? verifiedEvidence("Organization record")
        : sourceEvidence("Organization record"),
      metadata: {
        countryCode: organization.countryCode ?? null,
        verified: organization.verified,
        currentAffiliation: true,
      },
    });
    addEdge({
      id: researcherNodeId + "->affiliated-with->" + nodeId,
      source: researcherNodeId,
      target: nodeId,
      type: "affiliated-with",
      label: affiliation.title ? "Affiliated as " + affiliation.title : "Current affiliation",
      evidence: organization.verified
        ? verifiedEvidence("Organization record")
        : sourceEvidence("Scientific Identity affiliation"),
    });
  }

  for (const relation of researcher.topics) {
    const topic = relation.topic;
    const nodeId = graphId("topic", topic.id);
    addNode({
      id: nodeId,
      entityId: topic.id,
      type: "topic",
      label: topic.name,
      subtitle: topic.meshId ? "MeSH " + topic.meshId : "Research topic",
      evidence: sourceEvidence("Canonical research taxonomy"),
      metadata: {
        slug: topic.slug,
        weight: relation.weight,
        meshId: topic.meshId ?? null,
      },
    });
    addEdge({
      id: researcherNodeId + "->researches->" + nodeId,
      source: researcherNodeId,
      target: nodeId,
      type: "researches",
      label: "Research focus",
      evidence: assertedEvidence("Scientific Identity", "Research focus is profile-owned scientific context."),
    });
  }

  for (const relation of researcher.methods) {
    const method = relation.method;
    const nodeId = graphId("method", method.id);
    addNode({
      id: nodeId,
      entityId: method.id,
      type: "method",
      label: method.name,
      subtitle: "Research method",
      evidence: sourceEvidence("Canonical method taxonomy"),
      metadata: { slug: method.slug, proficiency: relation.proficiency },
    });
    addEdge({
      id: researcherNodeId + "->uses-method->" + nodeId,
      source: researcherNodeId,
      target: nodeId,
      type: "uses-method",
      label: "Uses method",
      evidence: assertedEvidence("Scientific Identity", "Method proficiency is profile-owned scientific context."),
    });
  }

  for (const relation of researcher.publications) {
    const publication = relation.publication;
    const nodeId = graphId("publication", publication.id);
    const evidence = publicationEvidence(relation.evidenceLevel);
    addNode({
      id: nodeId,
      entityId: publication.id,
      type: "publication",
      label: publication.title,
      subtitle: [publication.journal, publication.publicationDate?.getUTCFullYear()].filter(Boolean).join(" · ") || "Publication",
      href: publication.sourceUrl ?? (publication.pmid ? "https://pubmed.ncbi.nlm.nih.gov/" + publication.pmid + "/" : undefined),
      evidence,
      metadata: {
        pmid: publication.pmid ?? null,
        doi: publication.doi ?? null,
        pmcid: publication.pmcid ?? null,
        publicationType: publication.publicationType ?? null,
        lastObservedAt: relation.lastObservedAt.toISOString(),
      },
    });
    addEdge({
      id: researcherNodeId + "->authored->" + nodeId,
      source: researcherNodeId,
      target: nodeId,
      type: "authored",
      label: relation.authorOrder ? "Author #" + relation.authorOrder : "Publication relationship",
      evidence,
    });
  }

  for (const membership of researcher.labMemberships) {
    const lab = membership.laboratory;
    const labNodeId = graphId("laboratory", lab.id);
    const organizationNodeId = graphId("institution", lab.organization.id);

    addNode({
      id: labNodeId,
      entityId: lab.id,
      type: "laboratory",
      label: lab.name,
      subtitle: membership.role ?? "Laboratory",
      href: lab.website ?? undefined,
      evidence: lab.verified ? verifiedEvidence("Laboratory record") : sourceEvidence("Laboratory record"),
      metadata: { verified: lab.verified },
    });
    addNode({
      id: organizationNodeId,
      entityId: lab.organization.id,
      type: "institution",
      label: lab.organization.name,
      subtitle: opportunityTypeLabel(lab.organization.type),
      href: lab.organization.website ?? undefined,
      evidence: lab.organization.verified ? verifiedEvidence("Organization record") : sourceEvidence("Organization record"),
      metadata: {
        countryCode: lab.organization.countryCode ?? null,
        verified: lab.organization.verified,
        currentAffiliation: researcher.affiliations.some((item) => item.organizationId === lab.organization.id),
      },
    });
    addEdge({
      id: researcherNodeId + "->member-of->" + labNodeId,
      source: researcherNodeId,
      target: labNodeId,
      type: "member-of",
      label: membership.role ?? "Lab member",
      evidence: lab.verified ? verifiedEvidence("Laboratory record") : sourceEvidence("Lab membership"),
    });
    addEdge({
      id: labNodeId + "->part-of->" + organizationNodeId,
      source: labNodeId,
      target: organizationNodeId,
      type: "part-of",
      label: "Part of institution",
      evidence: lab.organization.verified ? verifiedEvidence("Organization record") : sourceEvidence("Laboratory record"),
    });
  }

  for (const opportunity of opportunities) {
    const opportunityNodeId = graphId("opportunity", opportunity.id);
    const organizationNodeId = graphId("institution", opportunity.organization.id);
    const evidence = opportunityEvidence(opportunity.sourceName, opportunity.lastVerifiedAt);

    addNode({
      id: organizationNodeId,
      entityId: opportunity.organization.id,
      type: "institution",
      label: opportunity.organization.name,
      subtitle: opportunityTypeLabel(opportunity.organization.type),
      href: opportunity.organization.website ?? undefined,
      evidence: opportunity.organization.verified ? verifiedEvidence("Organization record") : sourceEvidence("Organization record"),
      metadata: {
        countryCode: opportunity.organization.countryCode ?? null,
        verified: opportunity.organization.verified,
        currentAffiliation: researcher.affiliations.some((item) => item.organizationId === opportunity.organization.id),
      },
    });
    addNode({
      id: opportunityNodeId,
      entityId: opportunity.id,
      type: "opportunity",
      label: opportunity.title,
      subtitle: opportunityTypeLabel(opportunity.type),
      href: opportunity.applicationUrl ?? opportunity.sourceUrl,
      evidence,
      metadata: {
        deadline: opportunity.deadline?.toISOString() ?? null,
        sourceName: opportunity.sourceName,
        countryCode: opportunity.countryCode ?? null,
        lastSeenAt: opportunity.lastSeenAt.toISOString(),
      },
    });
    addEdge({
      id: organizationNodeId + "->offers->" + opportunityNodeId,
      source: organizationNodeId,
      target: opportunityNodeId,
      type: "offers",
      label: "Offers opportunity",
      evidence,
    });

    for (const relation of opportunity.topics) {
      const topicNodeId = graphId("topic", relation.topic.id);
      addNode({
        id: topicNodeId,
        entityId: relation.topic.id,
        type: "topic",
        label: relation.topic.name,
        subtitle: relation.topic.meshId ? "MeSH " + relation.topic.meshId : "Research topic",
        evidence: sourceEvidence("Canonical research taxonomy"),
        metadata: {
          slug: relation.topic.slug,
          weight: relation.weight,
          meshId: relation.topic.meshId ?? null,
        },
      });
      addEdge({
        id: opportunityNodeId + "->focuses-on->" + topicNodeId,
        source: opportunityNodeId,
        target: topicNodeId,
        type: "focuses-on",
        label: "Opportunity research focus",
        evidence,
      });
    }

    for (const relation of opportunity.methods) {
      const methodNodeId = graphId("method", relation.method.id);
      addNode({
        id: methodNodeId,
        entityId: relation.method.id,
        type: "method",
        label: relation.method.name,
        subtitle: "Research method",
        evidence: sourceEvidence("Canonical method taxonomy"),
        metadata: { slug: relation.method.slug },
      });
      addEdge({
        id: opportunityNodeId + "->uses-method-in-opportunity->" + methodNodeId,
        source: opportunityNodeId,
        target: methodNodeId,
        type: "uses-method-in-opportunity",
        label: "Opportunity method",
        evidence,
      });
    }
  }

  const counts: Record<ScientificGraphNodeType, number> = {
    researcher: 0,
    publication: 0,
    topic: 0,
    method: 0,
    laboratory: 0,
    institution: 0,
    opportunity: 0,
  };
  for (const node of nodes.values()) counts[node.type] += 1;

  return {
    researcherId: researcher.id,
    generatedAt: new Date().toISOString(),
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
    counts,
    truncated,
    limits: LIMITS,
  };
}
