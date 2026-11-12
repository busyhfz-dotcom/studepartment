import { NextResponse, type NextRequest } from "next/server";
import type { ApiError, ApiSuccess, SavedOpportunityListResponse, SaveOpportunityInput } from "@/lib/api-contracts";
import { AuthenticationRequiredError, requireCurrentUser } from "@/server/auth/current-user";
import { consumeRateLimit, RateLimitExceededError, rateLimitErrorResponse } from "@/server/security/rate-limit";
import {
  listSavedOpportunities,
  removeSavedOpportunity,
  saveOpportunity,
  SavedOpportunityError,
  updateSavedOpportunity,
} from "@/server/opportunities/saved-opportunities";

function errorResponse(status: number, code: string, message: string) {
  const body: ApiError = { success: false, error: { code, message } };
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

/** Every change to the saved list is written to the database, so it is capped per account. */
async function limitWrites() {
  const user = await requireCurrentUser();
  await consumeRateLimit("saved-opportunities:write", "user:" + user.id, { windowSeconds: 3600, max: 300 });
}

export async function PATCH(request: NextRequest) {
  try {
    await limitWrites();
    const body = await request.json() as { opportunityId?: unknown; applicationStage?: unknown; notes?: unknown; deadlineAlert?: unknown; alertLeadDays?: unknown } | null;
    if (!body || typeof body.opportunityId !== "string" || typeof body.applicationStage !== "string"
      || (body.notes !== undefined && body.notes !== null && typeof body.notes !== "string")
      || (body.deadlineAlert !== undefined && typeof body.deadlineAlert !== "boolean")
      || (body.alertLeadDays !== undefined && typeof body.alertLeadDays !== "number")) {
      return errorResponse(400, "INVALID_APPLICATION_UPDATE", "Choose a valid opportunity, application stage and reminder settings.");
    }
    const data = await updateSavedOpportunity({
      opportunityId: body.opportunityId,
      applicationStage: body.applicationStage,
      notes: body.notes,
      deadlineAlert: body.deadlineAlert,
      alertLeadDays: body.alertLeadDays,
    });
    return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    if (error instanceof AuthenticationRequiredError) return errorResponse(401, error.code, error.message);
    if (error instanceof SavedOpportunityError) return errorResponse(error.status, error.code, error.message);
    if (error instanceof SyntaxError) return errorResponse(400, "INVALID_JSON", "Request body must be valid JSON.");
    console.error("Saved opportunity update failed", error);
    return errorResponse(500, "APPLICATION_UPDATE_FAILED", "Application stage could not be updated.");
  }
}

export async function GET() {
  try {
    const data = await listSavedOpportunities();
    const body: ApiSuccess<SavedOpportunityListResponse> = { success: true, data };
    return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return errorResponse(401, error.code, error.message);
    console.error("Saved opportunity list failed", error);
    return errorResponse(500, "SAVED_OPPORTUNITIES_FAILED", "Saved opportunities could not be loaded.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await limitWrites();
    const input = (await request.json()) as Partial<Record<keyof SaveOpportunityInput, unknown>> | null;
    if (!input || typeof input.opportunityId !== "string"
      || (input.notes !== undefined && input.notes !== null && typeof input.notes !== "string")
      || (input.deadlineAlert !== undefined && typeof input.deadlineAlert !== "boolean")
      || (input.alertLeadDays !== undefined && typeof input.alertLeadDays !== "number")) {
      return errorResponse(400, "INVALID_SAVE_REQUEST", "Choose a valid opportunity and reminder settings.");
    }
    const saved = await saveOpportunity(input as SaveOpportunityInput);
    return NextResponse.json({ success: true, data: saved }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    if (error instanceof AuthenticationRequiredError) return errorResponse(401, error.code, error.message);
    if (error instanceof SavedOpportunityError) return errorResponse(error.status, error.code, error.message);
    if (error instanceof SyntaxError) return errorResponse(400, "INVALID_JSON", "Request body must be valid JSON.");
    console.error("Save opportunity failed", error);
    return errorResponse(500, "SAVE_OPPORTUNITY_FAILED", "Opportunity could not be saved.");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const opportunityId = request.nextUrl.searchParams.get("opportunity")?.trim();
    if (!opportunityId) return errorResponse(400, "OPPORTUNITY_REQUIRED", "Opportunity id is required.");
    await limitWrites();
    await removeSavedOpportunity(opportunityId);
    return NextResponse.json({ success: true, data: { opportunityId, removed: true } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    if (error instanceof AuthenticationRequiredError) return errorResponse(401, error.code, error.message);
    console.error("Remove saved opportunity failed", error);
    return errorResponse(500, "REMOVE_SAVED_OPPORTUNITY_FAILED", "Saved opportunity could not be removed.");
  }
}
