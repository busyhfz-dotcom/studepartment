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

export type DiscoveryAvailability = "open" | "selective" | "quiet" | "closed";

export type ResearcherDiscoveryQuery = {
  text: string;
  topicSlugs: string[];
  methodSlugs: string[];
  countryCodes: string[];
  careerStages: string[];
  availability: DiscoveryAvailability[];
  limit: number;
};

export type DiscoveryScoreBreakdown = {
  text: number;
  topics: number;
  methods: number;
  geography: number;
  availability: number;
  trust: number;
};

export type ResearcherDiscoveryResult = {
  id: string;
  fullName: string;
  headline: string;
  institution: string;
  location: string;
  careerStage: string;
  researchInterests: string[];
  methods: string[];
  alignment: "strong" | "relevant" | "complementary";
  reasons: string[];
  availability: DiscoveryAvailability;
  confidence: "high" | "medium" | "low";
  verifiedSignals: string[];
  score: number;
  scoreBreakdown: DiscoveryScoreBreakdown;
};

export type ResearcherDiscoveryResponse = {
  query: ResearcherDiscoveryQuery;
  results: ResearcherDiscoveryResult[];
  totalConsidered: number;
  cappedAt: number;
};

export type InstitutionalEntityType = "laboratory" | "institution";
export type InstitutionalOrganizationType =
  | "university"
  | "hospital"
  | "research-institute"
  | "company"
  | "foundation";

export type InstitutionalDiscoveryQuery = {
  entityType: InstitutionalEntityType;
  text: string;
  topicSlugs: string[];
  methodSlugs: string[];
  countryCodes: string[];
  organizationTypes: InstitutionalOrganizationType[];
  limit: number;
};

export type InstitutionalDiscoveryScoreBreakdown = {
  text: number;
  topics: number;
  methods: number;
  geography: number;
  activity: number;
  trust: number;
};

export type InstitutionalDiscoveryResult = {
  id: string;
  entityType: InstitutionalEntityType;
  name: string;
  organizationName?: string;
  organizationType: InstitutionalOrganizationType;
  description: string;
  location: string;
  countryCode: string;
  website?: string | null;
  verified: boolean;
  activeResearcherCount: number;
  labCount: number;
  researchInterests: string[];
  methods: string[];
  confidence: "high" | "medium" | "low";
  reasons: string[];
  score: number;
  scoreBreakdown: InstitutionalDiscoveryScoreBreakdown;
};

export type InstitutionalDiscoveryResponse = {
  query: InstitutionalDiscoveryQuery;
  results: InstitutionalDiscoveryResult[];
  totalConsidered: number;
  cappedAt: number;
  retrievalMode: "structured-lexical";
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
  availability: DiscoveryAvailability;
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
    availability: DiscoveryAvailability;
  };
  purpose: IntroductionPurpose;
  relevance: "strong" | "relevant" | "weak";
  reasons: string[];
  requestAllowed: boolean;
  blockReason?: string;
};
