import { NextResponse, type NextRequest } from "next/server";
import type { ApiError, ApiSuccess, InstitutionalDiscoveryResponse } from "@/lib/api-contracts";
import { rerankInstitutionalDiscovery } from "@/server/discovery/hybrid-rerank";
import { discoverInstitutionalEntities } from "@/server/discovery/institutional-discovery";
import { parseInstitutionalDiscoveryQuery } from "@/server/discovery/query";

export async function GET(request: NextRequest) {
  try {
    const query = parseInstitutionalDiscoveryQuery(request.nextUrl.searchParams);
    const structured = await discoverInstitutionalEntities(query);
    const discovery = await rerankInstitutionalDiscovery(structured);
    const body: ApiSuccess<InstitutionalDiscoveryResponse> = { success: true, data: discovery };
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
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
