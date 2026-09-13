export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type ResearcherDiscoveryResult = {
  id: string;
  fullName: string;
  headline: string;
  institution: string;
  alignment: "strong" | "relevant" | "complementary";
  reasons: string[];
  availability: "open" | "selective" | "quiet" | "closed";
  confidence: "high" | "medium" | "low";
};

export type ProfileResponse = {
  id: string;
  fullName: string;
  headline: string;
  institution: string;
  careerStage: string;
  availability: "open" | "selective" | "quiet" | "closed";
  researchInterests: string[];
  methods: string[];
  collaborationGoals: string[];
  verification: Array<{ label: string; verified: boolean }>;
};

export type OpportunityResult = {
  id: string;
  type: "phd" | "postdoc" | "fellowship" | "grant" | "collaboration" | "research-assistantship";
  title: string;
  organization: string;
  location: string;
  deadline?: string;
  sourceUrl: string;
  lastVerifiedAt: string;
  relevance: "strong" | "relevant" | "exploratory";
  eligibility: "likely" | "review" | "unlikely";
  reasons: string[];
  gaps: string[];
};
