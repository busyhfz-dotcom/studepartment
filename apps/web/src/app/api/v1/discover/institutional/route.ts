import { NextResponse, type NextRequest } from "next/server";
import type { ApiError, ApiSuccess, InstitutionalDiscoveryResponse } from "@/lib/api-contracts";
import { rerankInstitutionalDiscovery } from "@/server/discovery/hybrid-rerank";
import { discoverInstitutionalEntities } from "@/server/discovery/institutional-discovery";
import { suppressPrivateFeedback } from "@/server/feedback/private-feedback";
import { parseInstitutionalDiscoveryQuery } from "@/server/discovery/query";
import {
  consumeClientRateLimit,
  RateLimitExceededError,
  rateLimitErrorResponse,
} from "@/server/security/rate-limit";

export async function GET(request: NextRequest) {
  try {
    await consumeClientRateLimit(request, "discovery:institutional", { windowSeconds: 60, max: 120 });
    const query = parseInstitutionalDiscoveryQuery(request.nextUrl.searchParams);
    const structured = await discoverInstitutionalEntities(query);
    const discovery = await rerankInstitutionalDiscovery(structured);
    const entityType = query.entityType === "laboratory" ? "laboratory" : "institution";
    const results = await suppressPrivateFeedback(entityType, discovery.results, (item) => item.id);
    const data: InstitutionalDiscoveryResponse = { ...discovery, results };
    const body: ApiSuccess<InstitutionalDiscoveryResponse> = { success: true, data };
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    console.error("Institutional discovery failed", error);
    const body: ApiError = {
      success: false,
      error: {
        code: "INSTITUTIONAL_DISCOVERY_FAILED",
        message: "Institutional discovery is temporarily unavailable.",
      },
    };
    return NextResponse.json(body, { status: 500 });
  }
}
