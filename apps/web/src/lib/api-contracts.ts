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
