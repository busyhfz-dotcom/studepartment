import { NextResponse, type NextRequest } from "next/server";
import type { ApiError, ApiSuccess, SavedOpportunityListResponse, SaveOpportunityInput } from "@/lib/api-contracts";
import { AuthenticationRequiredError } from "@/server/auth/current-user";
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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json() as { opportunityId?: unknown; applicationStage?: unknown; notes?: unknown };
    if (typeof body.opportunityId !== "string" || typeof body.applicationStage !== "string" || (body.notes !== undefined && body.notes !== null && typeof body.notes !== "string")) {
      return errorResponse(400, "INVALID_APPLICATION_UPDATE", "Opportunity id, stage and optional notes are required.");
    }
    const data = await updateSavedOpportunity({ opportunityId: body.opportunityId, applicationStage: body.applicationStage, notes: body.notes as string | null | undefined });
    return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
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
    const input = (await request.json()) as SaveOpportunityInput;
    const saved = await saveOpportunity(input);
    return NextResponse.json({ success: true, data: saved }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return errorResponse(401, error.code, error.message);
    if (error instanceof SavedOpportunityError) return errorResponse(error.status, error.code, error.message);
    console.error("Save opportunity failed", error);
    return errorResponse(500, "SAVE_OPPORTUNITY_FAILED", "Opportunity could not be saved.");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const opportunityId = request.nextUrl.searchParams.get("opportunity")?.trim();
    if (!opportunityId) return errorResponse(400, "OPPORTUNITY_REQUIRED", "Opportunity id is required.");
    await removeSavedOpportunity(opportunityId);
    return NextResponse.json({ success: true, data: { opportunityId, removed: true } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return errorResponse(401, error.code, error.message);
    console.error("Remove saved opportunity failed", error);
    return errorResponse(500, "REMOVE_SAVED_OPPORTUNITY_FAILED", "Saved opportunity could not be removed.");
  }
}
