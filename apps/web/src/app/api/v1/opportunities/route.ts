import { NextResponse } from "next/server";
import type { ApiSuccess, OpportunityResult } from "@/lib/api-contracts";

const opportunities: OpportunityResult[] = [
  {
    id: "ki-postdoc-immunotherapy",
    type: "postdoc",
    title: "Postdoctoral Researcher · Translational Cancer Immunology",
    organization: "Karolinska Institutet",
    location: "Stockholm, Sweden",
    deadline: "2026-10-15",
    sourceUrl: "https://example.org/opportunities/ki-postdoc-immunotherapy",
    lastVerifiedAt: "2026-09-13",
    relevance: "strong",
    eligibility: "likely",
    reasons: ["Cancer immunotherapy", "Clinical research background", "Biomarker experience"],
    gaps: ["Confirm wet-lab methodology requirement"],
  },
  {
    id: "oxford-fellowship-oncology",
    type: "fellowship",
    title: "Early Career Fellowship · Precision Oncology",
    organization: "University of Oxford",
    location: "Oxford, UK",
    deadline: "2026-11-03",
    sourceUrl: "https://example.org/opportunities/oxford-fellowship-oncology",
    lastVerifiedAt: "2026-09-13",
    relevance: "relevant",
    eligibility: "review",
    reasons: ["Translational oncology", "Compatible career stage"],
    gaps: ["Review independent funding eligibility", "Confirm geographic eligibility"],
  },
];

export async function GET() {
  const body: ApiSuccess<OpportunityResult[]> = { success: true, data: opportunities };
  return NextResponse.json(body);
}
