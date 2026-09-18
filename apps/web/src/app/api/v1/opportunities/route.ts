import { NextResponse, type NextRequest } from "next/server";
import type { ApiError, ApiSuccess, OpportunityIntelligenceResponse } from "@/lib/api-contracts";
import { discoverOpportunities } from "@/server/opportunities/intelligence";
import { parseOpportunityQuery } from "@/server/opportunities/query";

export async function GET(request: NextRequest) {
  try {
    const query = parseOpportunityQuery(request.nextUrl.searchParams);
    const data = await discoverOpportunities(query);
    const body: ApiSuccess<OpportunityIntelligenceResponse> = { success: true, data };
    return NextResponse.json(body, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
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
