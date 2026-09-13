import { NextResponse } from "next/server";
import type { ApiSuccess, ResearcherDiscoveryResult } from "@/lib/api-contracts";
import { researcherRepository } from "@/server/repositories/researcher-repository";

export async function GET() {
  const results = await researcherRepository.discoverResearchers();
  const body: ApiSuccess<ResearcherDiscoveryResult[]> = { success: true, data: results };
  return NextResponse.json(body);
}
