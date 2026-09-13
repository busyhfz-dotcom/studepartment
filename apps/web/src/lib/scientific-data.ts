export type CollaborationGoal =
  | "Research collaboration"
  | "Mentorship"
  | "Student supervision"
  | "Clinical project"
  | "Grant partnership"
  | "Position opportunities";

export type ResearcherPreview = {
  id: string;
  name: string;
  title: string;
  institution: string;
  location: string;
  topics: string[];
  methods: string[];
  openTo: CollaborationGoal[];
  verified: boolean;
  match: {
    level: "Strong" | "Good" | "Exploratory";
    reasons: string[];
  };
};

export const currentResearcher = {
  name: "Dr. Sarah Williams",
  title: "Clinical Researcher",
  institution: "University of Oxford",
  location: "Oxford, United Kingdom",
  summary:
    "Translational oncology researcher focused on immune-based therapies, biomarkers, and clinically actionable evidence.",
  topics: ["Oncology", "Cancer immunotherapy", "Biomarkers", "Clinical trials"],
  methods: ["Clinical trial design", "Translational research", "Biomarker analysis"],
  openTo: ["Research collaboration", "Clinical project", "Grant partnership"] satisfies CollaborationGoal[],
  verification: ["Institution", "ORCID", "Publications"],
};

export const researcherPreviews: ResearcherPreview[] = [
  {
    id: "michael-chen",
    name: "Dr. Michael Chen",
    title: "Associate Professor of Computational Oncology",
    institution: "Karolinska Institutet",
    location: "Stockholm, Sweden",
    topics: ["Computational oncology", "Tumor biomarkers", "Precision medicine"],
    methods: ["Machine learning", "Multi-omics", "Clinical prediction"],
    openTo: ["Research collaboration", "Grant partnership"],
    verified: true,
    match: {
      level: "Strong",
      reasons: ["Shared biomarker focus", "Complementary computational methods", "Open to grant collaboration"],
    },
  },
  {
    id: "nora-klein",
    name: "Prof. Nora Klein",
    title: "Principal Investigator, Tumor Immunology",
    institution: "Heidelberg University Hospital",
    location: "Heidelberg, Germany",
    topics: ["Tumor immunology", "Immune checkpoints", "Translational oncology"],
    methods: ["Single-cell profiling", "Translational research", "Immune phenotyping"],
    openTo: ["Research collaboration", "Student supervision"],
    verified: true,
    match: {
      level: "Strong",
      reasons: ["High topic overlap", "Shared translational focus", "Currently open to collaboration"],
    },
  },
  {
    id: "lucas-martin",
    name: "Dr. Lucas Martin",
    title: "Clinical Scientist",
    institution: "Institut Gustave Roussy",
    location: "Villejuif, France",
    topics: ["Clinical oncology", "Early phase trials", "Therapeutic biomarkers"],
    methods: ["Phase I/II trials", "Protocol development", "Biomarker validation"],
    openTo: ["Clinical project", "Research collaboration"],
    verified: true,
    match: {
      level: "Good",
      reasons: ["Compatible clinical methods", "Related oncology focus", "Open to clinical projects"],
    },
  },
];
