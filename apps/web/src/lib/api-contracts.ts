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

export type CollaborationGoalValue =
  | "research-collaboration"
  | "mentorship"
  | "student-supervision"
  | "clinical-project"
  | "grant-partnership"
  | "position-opportunities";

export type ProfileCompleteness = {
  percent: number;
  completed: number;
  total: number;
  dimensions: Array<{
    key: string;
    label: string;
    complete: boolean;
  }>;
  note: "Guidance only — not a reputation or researcher ranking score.";
};

export type OrganizationOption = {
  id: string;
  name: string;
  type: string;
  countryCode: string | null;
  verified: boolean;
};

export type ProfileResponse = {
  id: string;
  fullName: string;
  headline: string;
  institution: string;
  organizationId?: string | null;
  careerStage: string;
  availability: "open" | "selective" | "quiet" | "closed";
  researchInterests: string[];
  methods: string[];
  collaborationGoals: string[];
  verification: Array<{ label: string; verified: boolean }>;
  bio?: string | null;
  city?: string | null;
  countryCode?: string | null;
  location?: string;
  orcid?: string | null;
  profilePublic?: boolean;
  topicSlugs?: string[];
  methodSlugs?: string[];
  completeness?: ProfileCompleteness;
};

export type ProfileUpdateInput = {
  fullName?: string;
  headline?: string | null;
  bio?: string | null;
  city?: string | null;
  countryCode?: string | null;
  careerStage?: string | null;
  organizationId?: string | null;
  orcid?: string | null;
  profilePublic?: boolean;
  availability?: ProfileResponse["availability"];
  collaborationGoals?: CollaborationGoalValue[];
  topicSlugs?: string[];
  methodSlugs?: string[];
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

export type IntroductionPurpose =
  | "research-discussion"
  | "collaboration"
  | "mentorship"
  | "position-inquiry"
  | "grant-partnership"
  | "clinical-project";

export type ScientificIntroductionPreview = {
  sender: {
    id: string;
    fullName: string;
    headline: string;
    institution: string;
    verified: boolean;
  };
  receiver: {
    id: string;
    fullName: string;
    availability: "open" | "selective" | "quiet" | "closed";
  };
  purpose: IntroductionPurpose;
  relevance: "strong" | "relevant" | "weak";
  reasons: string[];
  requestAllowed: boolean;
  blockReason?: string;
};
