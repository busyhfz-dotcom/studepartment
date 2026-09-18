import { NextResponse } from "next/server";
import type { ApiError, ApiSuccess, PublicationListResponse } from "@/lib/api-contracts";
import { AuthenticationRequiredError } from "@/server/auth/current-user";
import { listOwnedPublications, PublicationEnrichmentError } from "@/server/publications/enrichment";

function errorResponse(status: number, code: string, message: string) {
  const body: ApiError = { success: false, error: { code, message } };
  return NextResponse.json(body, { status });
}

export async function GET() {
  try {
    const data = await listOwnedPublications();
    const body: ApiSuccess<PublicationListResponse> = { success: true, data };
    return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return errorResponse(401, error.code, error.message);
    if (error instanceof PublicationEnrichmentError) return errorResponse(400, error.code, error.message);
    console.error("Publication list failed", error);
    return errorResponse(500, "PUBLICATION_LIST_FAILED", "Publications could not be loaded.");
  }
}
