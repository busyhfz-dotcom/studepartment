import { NextResponse, type NextRequest } from "next/server";
import type { ApiError, ApiSuccess, OrganizationProfileResponse } from "@/lib/api-contracts";
import { profileImageAvailableToUser } from "@/server/profile-images";
import {
  AuthenticationRequiredError,
  requireCurrentUser,
} from "@/server/auth/current-user";
import {
  createOwnedOrganization,
  getOwnedOrganization,
  OrganizationRepositoryError,
  updateOwnedOrganization,
} from "@/server/repositories/organization-repository";
import {
  parseOrganizationCreateInput,
  parseOrganizationUpdateInput,
  OrganizationValidationError,
} from "@/server/validation/organization";
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
    const organization = await getOwnedOrganization(user.id);
    if (!organization) {
      return apiError(404, "ORGANIZATION_NOT_FOUND", "No institutional profile is registered for this account.");
    }
    const body: ApiSuccess<OrganizationProfileResponse> = { success: true, data: organization };
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return apiError(401, error.code, error.message);
    }
    console.error("Failed to load institutional profile", error);
    return apiError(500, "ORGANIZATION_READ_FAILED", "Institutional profile could not be loaded.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await consumeClientRateLimit(request, "organization:create", { windowSeconds: 3600, max: 10 });
    const user = await requireCurrentUser();
    const input = parseOrganizationCreateInput(await request.json());
    if (!await profileImageAvailableToUser(user.id, input.logoUrl)) return apiError(400, "PHOTO_UNAVAILABLE", "Please upload your organization photo again before saving.");
    const organization = await createOwnedOrganization(user.id, input);
    const body: ApiSuccess<OrganizationProfileResponse> = { success: true, data: organization };
    return NextResponse.json(body, { status: 201 });
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    if (error instanceof AuthenticationRequiredError) {
      return apiError(401, error.code, error.message);
    }
    if (error instanceof OrganizationValidationError) {
      return apiError(400, error.code, error.message);
    }
    if (error instanceof OrganizationRepositoryError) {
      const status = error.code === "ORGANIZATION_ALREADY_CLAIMED" ? 409 : 400;
      return apiError(status, error.code, error.message);
    }
    if (error instanceof SyntaxError) {
      return apiError(400, "INVALID_JSON", "Request body must be valid JSON.");
    }
    console.error("Failed to create institutional profile", error);
    return apiError(500, "ORGANIZATION_CREATE_FAILED", "Institutional profile could not be created.");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await consumeClientRateLimit(request, "organization:update", { windowSeconds: 3600, max: 60 });
    const user = await requireCurrentUser();
    const input = parseOrganizationUpdateInput(await request.json());
    if (!await profileImageAvailableToUser(user.id, input.logoUrl)) return apiError(400, "PHOTO_UNAVAILABLE", "Please upload your organization photo again before saving.");
    const organization = await updateOwnedOrganization(user.id, input);
    const body: ApiSuccess<OrganizationProfileResponse> = { success: true, data: organization };
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    if (error instanceof AuthenticationRequiredError) {
      return apiError(401, error.code, error.message);
    }
    if (error instanceof OrganizationValidationError) {
      return apiError(400, error.code, error.message);
    }
    if (error instanceof OrganizationRepositoryError) {
      const status = error.code === "ORGANIZATION_NOT_FOUND" ? 404 : 400;
      return apiError(status, error.code, error.message);
    }
    if (error instanceof SyntaxError) {
      return apiError(400, "INVALID_JSON", "Request body must be valid JSON.");
    }
    console.error("Failed to update institutional profile", error);
    return apiError(500, "ORGANIZATION_UPDATE_FAILED", "Institutional profile could not be updated.");
  }
}
