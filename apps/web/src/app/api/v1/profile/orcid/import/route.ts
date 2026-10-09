import { NextResponse, type NextRequest } from "next/server";
import { AuthenticationRequiredError, requireCurrentUser } from "@/server/auth/current-user";
import { researcherRepository } from "@/server/repositories/researcher-repository";
import { isOrcidConfigured } from "@/server/integrations/orcid/client";
import { importOwnedOrcidProfile } from "@/server/integrations/orcid/import-profile";
import { consumeClientRateLimit, consumeRateLimit, RateLimitExceededError, rateLimitErrorResponse } from "@/server/security/rate-limit";

function failure(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, error: { code, message } }, { status, headers: { "Cache-Control": "private, no-store" } });
}
export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    if (user.accountKind !== "INDIVIDUAL") return failure(403, "INDIVIDUAL_REQUIRED", "ORCID imports are for individual researcher profiles.");
    await consumeClientRateLimit(request, "orcid:import", { windowSeconds: 3600, max: 20 });
    await consumeRateLimit("orcid:import:user", user.id, { windowSeconds: 3600, max: 8 });
    const input = await request.json();
    if (input?.consent !== true) return failure(400, "CONSENT_REQUIRED", "Confirm importing public ORCID information.");
    if (!isOrcidConfigured()) return failure(503, "ORCID_NOT_CONFIGURED", "Automatic ORCID import is awaiting platform activation. Your saved profile is unchanged.");
    const profile = await researcherRepository.getProfileForUser(user.id);
    if (!profile?.orcid) return failure(409, "ORCID_REQUIRED", "Save your ORCID iD in your profile first.");
    const data = await importOwnedOrcidProfile(profile.orcid);
    return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return failure(401, error.code, error.message);
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    if (error instanceof SyntaxError) return failure(400, "INVALID_JSON", "Send a valid import request.");
    return failure(502, "ORCID_IMPORT_FAILED", "ORCID information could not be imported. Your existing profile is preserved; please try again.");
  }
}
