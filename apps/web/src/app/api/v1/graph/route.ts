import { NextResponse, type NextRequest } from "next/server";
import type { ApiError, ApiSuccess, ScientificGraphNeighborhoodResponse } from "@/lib/api-contracts";
import {
  buildScientificGraph,
  ScientificGraphForbiddenError,
  ScientificGraphIdentityRequiredError,
  ScientificGraphNotFoundError,
} from "@/server/graph/scientific-graph";

function apiError(status: number, code: string, message: string) {
  const body: ApiError = { success: false, error: { code, message } };
  return NextResponse.json(body, { status });
}

export async function GET(request: NextRequest) {
  try {
    const researcherId = request.nextUrl.searchParams.get("researcher")?.trim() || undefined;
    const data = await buildScientificGraph(researcherId);
    const body: ApiSuccess<ScientificGraphNeighborhoodResponse> = { success: true, data };
    return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof ScientificGraphIdentityRequiredError) {
      return apiError(401, error.code, error.message);
    }
    if (error instanceof ScientificGraphForbiddenError) {
      return apiError(403, error.code, error.message);
    }
    if (error instanceof ScientificGraphNotFoundError) {
      return apiError(404, error.code, error.message);
    }
    console.error("Scientific graph failed", error);
    return apiError(500, "SCIENTIFIC_GRAPH_FAILED", "Scientific evidence graph is temporarily unavailable.");
  }
}
