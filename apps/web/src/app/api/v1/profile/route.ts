import { NextResponse, type NextRequest } from "next/server";
import type { ApiError, ApiSuccess, ProfileResponse } from "@/lib/api-contracts";
import {
  AuthenticationRequiredError,
  requireCurrentUser,
} from "@/server/auth/current-user";
import { recordProductEvent } from "@/server/analytics/product-events";
import {
  researcherRepository,
  ResearcherRepositoryError,
} from "@/server/repositories/researcher-repository";
import {
  parseProfileUpdateInput,
  ProfileValidationError,
} from "@/server/validation/profile";
import {
  consumeClientRateLimit,
  RateLimitExceededError,
  rateLimitErrorResponse,
} from "@/server/security/rate-limit";

function apiError(status: number, code: string, message: string) {
  const body: ApiError = { success: false, error: { code, message } };
  return NextResponse.json(body, { status });
}

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const profile = await researcherRepository.getProfileForUser(user.id);
    if (!profile) {
      return apiError(404, "PROFILE_NOT_FOUND", "Scientific profile not found.");
    }

    const body: ApiSuccess<ProfileResponse> = { success: true, data: profile };
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    if (error instanceof AuthenticationRequiredError) {
      return apiError(401, error.code, error.message);
    }
    console.error("Failed to load scientific profile", error);
    return apiError(500, "PROFILE_READ_FAILED", "Scientific profile could not be loaded.");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await consumeClientRateLimit(request, "profile:update", { windowSeconds: 3600, max: 60 });
    const user = await requireCurrentUser();
    const input = parseProfileUpdateInput(await request.json());
    const profile = await researcherRepository.updateProfileForUser(user.id, input);
    await recordProductEvent(user.id, "PROFILE_UPDATED");
    const body: ApiSuccess<ProfileResponse> = { success: true, data: profile };
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return apiError(401, error.code, error.message);
    }
    if (error instanceof ProfileValidationError) {
      return apiError(400, error.code, error.message);
    }
    if (error instanceof ResearcherRepositoryError) {
      const status = error.code === "ORCID_ALREADY_CONNECTED" ? 409 : 400;
      return apiError(status, error.code, error.message);
    }
    if (error instanceof SyntaxError) {
      return apiError(400, "INVALID_JSON", "Request body must be valid JSON.");
    }
    console.error("Failed to update scientific profile", error);
    return apiError(500, "PROFILE_UPDATE_FAILED", "Scientific profile could not be updated.");
  }
}
