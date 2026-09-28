import { NextResponse, type NextRequest } from "next/server";
import type { ApiError, ApiSuccess, ResearcherDiscoveryResponse } from "@/lib/api-contracts";
import { getCurrentUser } from "@/server/auth/current-user";
import { rerankResearcherDiscovery } from "@/server/discovery/hybrid-rerank";
import { discoverResearchers } from "@/server/discovery/researcher-discovery";
import { suppressPrivateFeedback } from "@/server/feedback/private-feedback";
import { parseResearcherDiscoveryQuery } from "@/server/discovery/query";
import { recordSearchAndUpdateInterest } from "@/server/personalization/interest-signals";
import {
  consumeClientRateLimit,
  RateLimitExceededError,
  rateLimitErrorResponse,
} from "@/server/security/rate-limit";

export async function GET(request: NextRequest) {
  try {
    await consumeClientRateLimit(request, "discovery:researchers", { windowSeconds: 60, max: 120 });
    const query = parseResearcherDiscoveryQuery(request.nextUrl.searchParams);
    const currentUser = await getCurrentUser();
    if (currentUser && query.text.trim()) {
      await recordSearchAndUpdateInterest(currentUser.id, query.text, "discover");
    }
    const structured = await discoverResearchers(query);
    const discovery = await rerankResearcherDiscovery(structured);
    const results = await suppressPrivateFeedback("researcher", discovery.results, (item) => item.id);
    const data: ResearcherDiscoveryResponse = { ...discovery, results };
    const body: ApiSuccess<ResearcherDiscoveryResponse> = { success: true, data };
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "private, no-store",
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
