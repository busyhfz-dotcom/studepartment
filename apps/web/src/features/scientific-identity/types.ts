export type VerificationSignal = {
  label: string;
  verified: boolean;
};

export type ResearchInterest = {
  name: string;
  weight?: number;
};

export type ResearchMethod = {
  name: string;
  proficiency?: "learning" | "working" | "advanced";
};

export type CollaborationGoal =
  | "research-collaboration"
  | "mentorship"
  | "student-supervision"
  | "clinical-project"
  | "grant-partnership"
  | "position-opportunities";

export type AvailabilityMode = "open" | "selective" | "quiet" | "closed";

export type ScientificIdentity = {
  id: string;
  fullName: string;
  headline: string;
  institution: string;
  location?: string;
  careerStage?: string;
  summary: string;
  researchInterests: ResearchInterest[];
  methods?: ResearchMethod[];
  openTo: string[];
  collaborationGoals?: CollaborationGoal[];
  availabilityMode?: AvailabilityMode;
  verification: VerificationSignal[];
};
