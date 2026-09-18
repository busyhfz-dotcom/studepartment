import { NextResponse, type NextRequest } from "next/server";
import type { ApiError, ApiSuccess, FeedbackListResponse, FeedbackRecord } from "@/lib/api-contracts";
import { AuthenticationRequiredError, requireCurrentUser } from "@/server/auth/current-user";
import {
  listFeedback,
  parseFeedbackInput,
  submitFeedback,
  FeedbackValidationError,
} from "@/server/feedback/private-feedback";
import {
  consumeClientRateLimit,
  RateLimitExceededError,
  rateLimitErrorResponse,
} from "@/server/security/rate-limit";

function error(status: number, code: string, message: string) {
  const body: ApiError = { success: false, error: { code, message } };
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const data = await listFeedback(user.id);
    const body: ApiSuccess<FeedbackListResponse> = { success: true, data };
    return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
  } catch (requestError) {
    if (requestError instanceof AuthenticationRequiredError) return error(401, requestError.code, requestError.message);
    console.error("Feedback list failed", requestError);
    return error(500, "FEEDBACK_LIST_FAILED", "Feedback could not be loaded.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await consumeClientRateLimit(request, "feedback:submit", { windowSeconds: 60, max: 60 });
    const user = await requireCurrentUser();
    const input = parseFeedbackInput(await request.json());
    const data = await submitFeedback(user.id, input);
    const body: ApiSuccess<FeedbackRecord> = { success: true, data };
    return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
  } catch (requestError) {
    if (requestError instanceof RateLimitExceededError) return rateLimitErrorResponse(requestError);
    if (requestError instanceof AuthenticationRequiredError) return error(401, requestError.code, requestError.message);
    if (requestError instanceof FeedbackValidationError) return error(requestError.status, requestError.code, requestError.message);
    if (requestError instanceof SyntaxError) return error(400, "INVALID_JSON", "Request body must be valid JSON.");
    console.error("Feedback submission failed", requestError);
    return error(500, "FEEDBACK_SUBMIT_FAILED", "Feedback could not be saved.");
  }
}
