import type { ProfileResponse, ResearcherDiscoveryResult } from "@/lib/api-contracts";
import { currentResearcher, researcherPreviews } from "@/lib/scientific-data";

export type ResearcherRepository = {
  getCurrentProfile(): Promise<ProfileResponse>;
  discoverResearchers(): Promise<ResearcherDiscoveryResult[]>;
};

function mapAlignment(level: "Strong" | "Good" | "Exploratory"): ResearcherDiscoveryResult["alignment"] {
  if (level === "Strong") return "strong";
  if (level === "Good") return "relevant";
  return "complementary";
}

const fixtureRepository: ResearcherRepository = {
  async getCurrentProfile() {
    return {
      id: "demo-researcher",
      fullName: currentResearcher.name,
      headline: `${currentResearcher.title} · Translational Oncology`,
      institution: currentResearcher.institution,
      careerStage: "Early-career researcher",
      availability: "selective",
      researchInterests: currentResearcher.topics,
      methods: currentResearcher.methods,
      collaborationGoals: currentResearcher.openTo,
      verification: [
        { label: "Institution", verified: currentResearcher.verification.includes("Institution") },
        { label: "ORCID", verified: currentResearcher.verification.includes("ORCID") },
        { label: "Publications", verified: currentResearcher.verification.includes("Publications") },
        { label: "Email", verified: false },
      ],
    };
  },

  async discoverResearchers() {
    return researcherPreviews.map((researcher) => ({
      id: researcher.id,
      fullName: researcher.name,
      headline: researcher.title,
      institution: researcher.institution,
      alignment: mapAlignment(researcher.match.level),
      reasons: researcher.match.reasons,
      availability: researcher.openTo.length > 0 ? "open" : "selective",
      confidence: researcher.verified ? "high" : "medium",
    }));
  },
};

function mapAvailability(value: "OPEN" | "SELECTIVE" | "QUIET" | "CLOSED"):
  ProfileResponse["availability"] {
  return value.toLowerCase() as ProfileResponse["availability"];
}

function formatCollaborationGoal(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const prismaRepository: ResearcherRepository = {
  async getCurrentProfile() {
    const { getDb } = await import("@studepartment/db");
    const db = getDb();

    // Until authentication is connected, the first public seeded profile acts as
    // the current development identity. Auth will replace this selector with userId.
    const profile = await db.researcherProfile.findFirst({
      where: { profilePublic: true },
      orderBy: { createdAt: "asc" },
      include: {
        affiliations: {
          where: { current: true },
          include: { organization: true },
          orderBy: { startDate: "desc" },
          take: 1,
        },
        topics: {
          include: { topic: true },
          orderBy: { weight: "desc" },
        },
        methods: {
          include: { method: true },
        },
        publications: {
          select: { publicationId: true },
          take: 1,
        },
      },
    });

    if (!profile) return fixtureRepository.getCurrentProfile();

    return {
      id: profile.id,
      fullName: profile.fullName,
      headline: profile.headline ?? "Medical researcher",
      institution: profile.affiliations[0]?.organization.name ?? "Independent researcher",
      careerStage: profile.careerStage ?? "Researcher",
      availability: mapAvailability(profile.availabilityMode),
      researchInterests: profile.topics.map(({ topic }) => topic.name),
      methods: profile.methods.map(({ method }) => method.name),
      collaborationGoals: profile.collaborationGoals.map(formatCollaborationGoal),
      verification: [
        { label: "Institution", verified: Boolean(profile.affiliations[0]?.organization.verified) },
        { label: "ORCID", verified: Boolean(profile.orcid) },
        { label: "Publications", verified: profile.publications.length > 0 },
        { label: "Profile", verified: profile.verified },
      ],
    };
  },

  async discoverResearchers() {
    const { getDb } = await import("@studepartment/db");
    const db = getDb();

    const researchers = await db.researcherProfile.findMany({
      where: { profilePublic: true },
      orderBy: [{ verified: "desc" }, { updatedAt: "desc" }],
      take: 20,
      include: {
        affiliations: {
          where: { current: true },
          include: { organization: true },
          take: 1,
        },
        topics: {
          include: { topic: true },
          orderBy: { weight: "desc" },
          take: 3,
        },
      },
    });

    if (researchers.length === 0) return fixtureRepository.discoverResearchers();

    return researchers.map((researcher) => {
      const topicReasons = researcher.topics.map(({ topic }) => topic.name);
      const availabilityReason =
        researcher.availabilityMode === "OPEN"
          ? "Open to scientific introductions"
          : researcher.availabilityMode === "SELECTIVE"
            ? "Selective availability"
            : "Availability controlled by recipient";

      return {
        id: researcher.id,
        fullName: researcher.fullName,
        headline: researcher.headline ?? "Medical researcher",
        institution: researcher.affiliations[0]?.organization.name ?? "Independent researcher",
        alignment: "relevant" as const,
        reasons: [...topicReasons, availabilityReason].slice(0, 3),
        availability: mapAvailability(researcher.availabilityMode),
        confidence: researcher.verified ? "high" as const : "medium" as const,
      };
    });
  },
};

export const researcherRepository: ResearcherRepository = process.env.DATABASE_URL
  ? prismaRepository
  : fixtureRepository;
