import { NextResponse, type NextRequest } from "next/server";
import type { ApiError, ApiSuccess } from "@/lib/api-contracts";
import { getPublicOpportunityTicker, type PublicOpportunityTicker } from "@/server/opportunities/public-ticker";
import { consumeClientRateLimit, RateLimitExceededError, rateLimitErrorResponse } from "@/server/security/rate-limit";

/** The homepage feed of newest listings, polled by open pages so new listings appear without a reload. */
export async function GET(request: NextRequest) {
  try {
    await consumeClientRateLimit(request, "opportunities:ticker", { windowSeconds: 60, max: 30 });
    const data = await getPublicOpportunityTicker();
    const body: ApiSuccess<PublicOpportunityTicker> = { success: true, data };
    return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    console.error("Opportunity ticker failed", error);
    const body: ApiError = { success: false, error: { code: "TICKER_UNAVAILABLE", message: "The opportunity feed is temporarily unavailable." } };
    return NextResponse.json(body, { status: 500 });
  }
}
