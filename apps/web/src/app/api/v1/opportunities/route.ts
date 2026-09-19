import { NextResponse, type NextRequest } from "next/server";
import type { ApiError, ApiSuccess, OpportunityIntelligenceResponse } from "@/lib/api-contracts";
import { discoverOpportunities } from "@/server/opportunities/intelligence";
import { suppressPrivateFeedback } from "@/server/feedback/private-feedback";
import { parseOpportunityQuery } from "@/server/opportunities/query";
import {
  consumeClientRateLimit,
  RateLimitExceededError,
  rateLimitErrorResponse,
} from "@/server/security/rate-limit";

export async function GET(request: NextRequest) {
  try {
    await consumeClientRateLimit(request, "opportunities:read", { windowSeconds: 60, max: 120 });
    const query = parseOpportunityQuery(request.nextUrl.searchParams);
    const discovery = await discoverOpportunities(query);
    const results = await suppressPrivateFeedback("opportunity", discovery.results, (item) => item.id);
    const data: OpportunityIntelligenceResponse = { ...discovery, results };
    const body: ApiSuccess<OpportunityIntelligenceResponse> = { success: true, data };
    return NextResponse.json(body, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    console.error("Opportunity intelligence failed", error);
    const body: ApiError = {
      success: false,
      error: {
        code: "OPPORTUNITY_INTELLIGENCE_FAILED",
        message: "Opportunity intelligence is temporarily unavailable.",
      },
    };
    return NextResponse.json(body, { status: 500 });
  }
}
