import { NextResponse } from "next/server";
import type { ApiSuccess, ProfileResponse } from "@/lib/api-contracts";

const profile: ProfileResponse = {
  id: "demo-researcher",
  fullName: "Dr. Sarah Williams",
  headline: "Clinical Researcher · Translational Oncology",
  institution: "University of Oxford",
  careerStage: "Early-career researcher",
  availability: "selective",
  researchInterests: ["Cancer Immunotherapy", "Biomarkers", "Clinical Trials"],
  methods: ["Clinical trial design", "Translational biomarkers"],
  collaborationGoals: ["Research collaboration", "Clinical projects", "Mentorship"],
  verification: [
    { label: "Institution", verified: true },
    { label: "ORCID", verified: true },
    { label: "Publications", verified: true },
    { label: "Email", verified: false },
  ],
};

export async function GET() {
  const body: ApiSuccess<ProfileResponse> = { success: true, data: profile };
  return NextResponse.json(body);
}
