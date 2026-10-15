import { NextResponse, type NextRequest } from "next/server";
import type { ApiError, ApiSuccess } from "@/lib/api-contracts";
import { getOpportunitySourceStatus, type PublicSourceStatus } from "@/server/opportunities/sources/sync";
import { consumeClientRateLimit, RateLimitExceededError, rateLimitErrorResponse } from "@/server/security/rate-limit";

/** Public list of the publishers Provenant reads, with live counts. */
export async function GET(request: NextRequest) {
  try {
    await consumeClientRateLimit(request, "opportunities:sources", { windowSeconds: 60, max: 60 });
    const data = await getOpportunitySourceStatus();
    const body: ApiSuccess<PublicSourceStatus[]> = { success: true, data };
    return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    console.error("Opportunity source status failed", error);
    const body: ApiError = { success: false, error: { code: "SOURCES_UNAVAILABLE", message: "Source status is temporarily unavailable." } };
    return NextResponse.json(body, { status: 500 });
  }
}
