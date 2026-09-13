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

// This boundary intentionally keeps route handlers independent from fixture data.
// A Prisma-backed implementation can replace this repository without changing API contracts.
export const researcherRepository: ResearcherRepository = fixtureRepository;
