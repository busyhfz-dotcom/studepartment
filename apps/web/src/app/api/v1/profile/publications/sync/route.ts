import { NextResponse } from "next/server";
import type { ApiError, ApiSuccess, PublicationSyncResult } from "@/lib/api-contracts";
import { AuthenticationRequiredError } from "@/server/auth/current-user";
import { OrcidConfigurationError, OrcidExchangeError } from "@/server/integrations/orcid/client";
import { PublicationEnrichmentError, syncOwnedPublications } from "@/server/publications/enrichment";

function errorResponse(status: number, code: string, message: string) {
  const body: ApiError = { success: false, error: { code, message } };
  return NextResponse.json(body, { status });
}

export async function POST() {
  try {
    const data = await syncOwnedPublications();
    const body: ApiSuccess<PublicationSyncResult> = { success: true, data };
    return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return errorResponse(401, error.code, error.message);
    if (error instanceof PublicationEnrichmentError) return errorResponse(409, error.code, error.message);
    if (error instanceof OrcidConfigurationError) return errorResponse(503, "ORCID_NOT_CONFIGURED", error.message);
    if (error instanceof OrcidExchangeError) return errorResponse(502, "ORCID_UPSTREAM_FAILED", "ORCID publication data is temporarily unavailable.");
    console.error("Publication synchronization failed", error);
    return errorResponse(500, "PUBLICATION_SYNC_FAILED", "Publication synchronization failed.");
  }
}
