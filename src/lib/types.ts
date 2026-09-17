export type Topic = {
  name: string;
  slug: string;
};

export type Researcher = {
  id: string;
  slug: string;
  name: string;
  initials: string;
  role: string;
  institution: string;
  location: string;
  bio: string;
  verified: boolean;
  collaborationOpen: boolean;
  topics: string[];
  methods: string[];
  publications: number;
  citations: string;
  currentFocus: string;
};

export type OpportunityKind =
  | "PhD"
  | "Postdoc"
  | "Fellowship"
  | "Grant"
  | "Collaboration"
  | "Research role";

export type Opportunity = {
  id: string;
  slug: string;
  kind: OpportunityKind;
  title: string;
  institution: string;
  lab: string;
  location: string;
  remote: boolean;
  deadline: string;
  funding: string;
  summary: string;
  topics: string[];
  requirements: string[];
  featured?: boolean;
};

export type MatchSignal = {
  label: string;
  strength: "high" | "medium" | "context";
  detail: string;
};

export type MatchExplanation = {
  verdict: "Strong alignment" | "Promising alignment" | "Contextual match";
  summary: string;
  signals: MatchSignal[];
  caution?: string;
};
