import { NextResponse } from "next/server";
import type { ApiSuccess, ScientificIntroductionPreview } from "@/lib/api-contracts";

const preview: ScientificIntroductionPreview = {
  sender: {
    id: "demo-researcher",
    fullName: "Dr. Sarah Williams",
    headline: "Clinical Researcher · Translational Oncology",
    institution: "University of Oxford",
    verified: true,
  },
  receiver: {
    id: "michael-chen",
    fullName: "Dr. Michael Chen",
    availability: "open",
  },
  purpose: "collaboration",
  relevance: "strong",
  reasons: [
    "Shared focus on pancreatic cancer",
    "Complementary clinical and imaging expertise",
    "Recipient is currently open to collaboration",
  ],
  requestAllowed: true,
};

export async function GET() {
  const body: ApiSuccess<ScientificIntroductionPreview> = { success: true, data: preview };
  return NextResponse.json(body);
}
