import { NextResponse, type NextRequest } from "next/server";
import type { ApiError, ApiSuccess, ResearcherDiscoveryResponse } from "@/lib/api-contracts";
import { rerankResearcherDiscovery } from "@/server/discovery/hybrid-rerank";
import { discoverResearchers } from "@/server/discovery/researcher-discovery";
import { parseResearcherDiscoveryQuery } from "@/server/discovery/query";
import {
  consumeClientRateLimit,
  RateLimitExceededError,
  rateLimitErrorResponse,
} from "@/server/security/rate-limit";

export async function GET(request: NextRequest) {
  try {
    await consumeClientRateLimit(request, "discovery:researchers", { windowSeconds: 60, max: 120 });
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
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
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
