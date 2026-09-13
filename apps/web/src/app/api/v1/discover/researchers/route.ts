import { NextResponse } from "next/server";
import type { ApiSuccess, ResearcherDiscoveryResult } from "@/lib/api-contracts";

const results: ResearcherDiscoveryResult[] = [
  {
    id: "michael-chen",
    fullName: "Dr. Michael Chen",
    headline: "Computational Oncologist",
    institution: "Karolinska Institutet",
    alignment: "strong",
    reasons: ["Pancreatic cancer", "Medical imaging", "Open to collaboration"],
    availability: "open",
    confidence: "high",
  },
  {
    id: "elena-rossi",
    fullName: "Prof. Elena Rossi",
    headline: "Professor of Translational Oncology",
    institution: "University of Milan",
    alignment: "relevant",
    reasons: ["Tumor biomarkers", "Clinical trials", "Selective availability"],
    availability: "selective",
    confidence: "high",
  },
  {
    id: "amir-haddad",
    fullName: "Dr. Amir Haddad",
    headline: "Biomedical AI Researcher",
    institution: "INSERM",
    alignment: "complementary",
    reasons: ["Deep learning", "Pathology imaging", "Grant collaboration"],
    availability: "selective",
    confidence: "medium",
  },
];

export async function GET() {
  const body: ApiSuccess<ResearcherDiscoveryResult[]> = { success: true, data: results };
  return NextResponse.json(body);
}
