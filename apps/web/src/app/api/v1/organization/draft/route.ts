import { NextResponse, type NextRequest } from "next/server";
import { AuthenticationRequiredError, requireCurrentUser } from "@/server/auth/current-user";
import { profileImageAvailableToUser } from "@/server/profile-images";
import { clearOrganizationDraft, OrganizationRepositoryError, saveOrganizationDraft } from "@/server/repositories/organization-repository";
import { consumeRateLimit, RateLimitExceededError, rateLimitErrorResponse } from "@/server/security/rate-limit";
import { OrganizationValidationError, parseOrganizationDraftInput } from "@/server/validation/organization";

const headers = { "Cache-Control": "private, no-store" };

function failure(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, error: { code, message } }, { status, headers });
}

async function changeDraft(request?: NextRequest) {
  try {
    const user = await requireCurrentUser();
    await consumeRateLimit("organization:draft", "user:" + user.id, { windowSeconds: 3600, max: 60 });
    if (!request) {
      await clearOrganizationDraft(user.id);
      return NextResponse.json({ success: true, data: null }, { headers });
    }
    const input = parseOrganizationDraftInput(await request.json());
    if (!await profileImageAvailableToUser(user.id, input.logoUrl)) {
      return failure(400, "PHOTO_UNAVAILABLE", "Upload your organization photo again before saving.");
    }
    const data = await saveOrganizationDraft(user.id, input);
    return NextResponse.json({ success: true, data }, { headers });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return failure(401, error.code, error.message);
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    if (error instanceof OrganizationRepositoryError) return failure(409, error.code, error.message);
    if (error instanceof OrganizationValidationError) return failure(400, error.code, error.message);
    if (error instanceof SyntaxError) return failure(400, "INVALID_JSON", "Request body must be valid JSON.");
    console.error("Organization draft could not be saved", error instanceof Error ? error.name : "UnknownError");
    return failure(500, "ORGANIZATION_DRAFT_FAILED", "Could not update the private draft. Try again.");
  }
}

export function PUT(request: NextRequest) {
  return changeDraft(request);
}

export function DELETE() {
  return changeDraft();
}
