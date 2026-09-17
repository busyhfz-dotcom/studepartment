import { NextResponse, type NextRequest } from "next/server";
import type { ApiError, ApiSuccess, ResearcherDiscoveryResponse } from "@/lib/api-contracts";
import { rerankResearcherDiscovery } from "@/server/discovery/hybrid-rerank";
import { discoverResearchers } from "@/server/discovery/researcher-discovery";
import { parseResearcherDiscoveryQuery } from "@/server/discovery/query";

export async function GET(request: NextRequest) {
  try {
    const query = parseResearcherDiscoveryQuery(request.nextUrl.searchParams);
    const structured = await discoverResearchers(query);
    const discovery = await rerankResearcherDiscovery(structured);
    const body: ApiSuccess<ResearcherDiscoveryResponse> = { success: true, data: discovery };
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Researcher discovery failed", error);
    const body: ApiError = {
      success: false,
      error: {
        code: "DISCOVERY_FAILED",
        message: "Researcher discovery is temporarily unavailable.",
      },
    };
    return NextResponse.json(body, { status: 500 });
  }
}
