export type VerificationSignal = {
  label: string;
  verified: boolean;
};

export type ResearchInterest = {
  name: string;
  weight?: number;
};

export type ScientificIdentity = {
  id: string;
  fullName: string;
  headline: string;
  institution: string;
  location?: string;
  summary: string;
  researchInterests: ResearchInterest[];
  openTo: string[];
  verification: VerificationSignal[];
};
