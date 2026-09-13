import { NextResponse } from "next/server";
import type { ApiSuccess, ResearcherDiscoveryResult } from "@/lib/api-contracts";
import { researcherPreviews } from "@/lib/scientific-data";

function toAlignment(level: "Strong" | "Good" | "Exploratory"): ResearcherDiscoveryResult["alignment"] {
  if (level === "Strong") return "strong";
  if (level === "Good") return "relevant";
  return "complementary";
}

export async function GET() {
  const results: ResearcherDiscoveryResult[] = researcherPreviews.map((researcher) => ({
    id: researcher.id,
    fullName: researcher.name,
    headline: researcher.title,
    institution: researcher.institution,
    alignment: toAlignment(researcher.match.level),
    reasons: researcher.match.reasons,
    availability: researcher.openTo.length > 0 ? "open" : "selective",
    confidence: researcher.verified ? "high" : "medium",
  }));

  const body: ApiSuccess<ResearcherDiscoveryResult[]> = { success: true, data: results };
  return NextResponse.json(body);
}
