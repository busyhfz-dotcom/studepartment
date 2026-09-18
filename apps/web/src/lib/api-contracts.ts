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
export type DiscoveryRetrievalMode = "structured-lexical" | "hybrid";

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
  semantic?: number;
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
  retrievalMode?: DiscoveryRetrievalMode;
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
  semantic?: number;
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
  retrievalMode: DiscoveryRetrievalMode;
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

export type OpportunityTypeValue =
  | "phd"
  | "postdoc"
  | "fellowship"
  | "grant"
  | "collaboration"
  | "research-assistantship";

export type OpportunityFreshness = "fresh" | "aging" | "stale";
export type OpportunityDeadlinePrecision = "exact" | "date-only" | "month-only" | "rolling" | "unknown";
export type OpportunitySourceTypeValue =
  | "institutional-careers"
  | "funder"
  | "lab-website"
  | "research-network"
  | "manual"
  | "import";

export type OpportunityQuery = {
  text: string;
  types: OpportunityTypeValue[];
  topicSlugs: string[];
  methodSlugs: string[];
  countryCodes: string[];
  deadlineWithinDays: number | null;
  includeStale: boolean;
  limit: number;
};

export type OpportunityResult = {
  id: string;
  type: OpportunityTypeValue;
  title: string;
  description?: string;
  organization: string;
  location: string;
  countryCode?: string;
  deadline?: string;
  deadlinePrecision: OpportunityDeadlinePrecision;
  sourceUrl: string;
  applicationUrl?: string;
  source: {
    type: OpportunitySourceTypeValue;
    name: string;
    recordId: string;
  };
  lastVerifiedAt: string;
  freshness: OpportunityFreshness;
  relevance: "strong" | "relevant" | "exploratory";
  relevanceScore: number;
  eligibility: "likely" | "review" | "unlikely";
  reasons: string[];
  eligibilityReasons: string[];
  gaps: string[];
  researchInterests: string[];
  methods: string[];
};

export type OpportunityIntelligenceResponse = {
  query: OpportunityQuery;
  results: OpportunityResult[];
  totalConsidered: number;
  cappedAt: number;
  personalized: boolean;
  profileContext: {
    careerStage?: string;
    countryCode?: string;
    topicSlugs: string[];
    methodSlugs: string[];
  } | null;
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
    headline: string;
    institution: string;
    availability: DiscoveryAvailability;
  };
  purpose: IntroductionPurpose;
  relevance: "strong" | "relevant" | "weak";
  reasons: string[];
  requestAllowed: boolean;
  blockReason?: string;
  guardrails: string[];
};

export type CreateIntroductionInput = {
  receiverId: string;
  purpose: IntroductionPurpose;
  context: string;
};

export type IntroductionRequestStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "withdrawn"
  | "expired"
  | "archived";

export type IntroductionRequestRecord = {
  id: string;
  direction: "incoming" | "outgoing";
  status: IntroductionRequestStatus;
  purpose: IntroductionPurpose;
  context: string;
  createdAt: string;
  expiresAt?: string;
  respondedAt?: string;
  counterpart: {
    id: string;
    fullName: string;
    headline: string;
    institution: string;
    verified: boolean;
  };
};

export type IntroductionListResponse = {
  box: "inbox" | "outbox";
  requests: IntroductionRequestRecord[];
};

export type IntroductionAction = "accept" | "decline" | "withdraw";

export type IntroductionPolicyResponse = {
  allowIntroductions: boolean;
  requireVerifiedSender: boolean;
  allowedPurposes: IntroductionPurpose[];
  cooldownDays: number;
  maxInboundPerDay: number;
};


export type PublicationEvidenceLevelValue =
  | "manual-asserted"
  | "orcid-asserted"
  | "pubmed-corroborated";

export type PublicationRecord = {
  id: string;
  title: string;
  journal?: string;
  publicationDate?: string;
  publicationType?: string;
  doi?: string;
  pmid?: string;
  pmcid?: string;
  sourceUrl?: string;
  authorNames: string[];
  evidenceLevel: PublicationEvidenceLevelValue;
  evidenceSources: Array<"ORCID" | "PubMed" | "Manual">;
  lastObservedAt: string;
};

export type PublicationListResponse = {
  publications: PublicationRecord[];
  total: number;
  orcid?: string;
  orcidVerified: boolean;
};

export type PublicationSyncResult = {
  orcid: string;
  observedAt: string;
  orcidWorksSeen: number;
  publicationsCreated: number;
  publicationsUpdated: number;
  relationshipsCreated: number;
  pubmedCorroborated: number;
  orcidOnly: number;
  staleRelationships: number;
  warnings: string[];
};
