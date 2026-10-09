import { NextResponse, type NextRequest } from "next/server";
import type { ApiError } from "@/lib/api-contracts";
import { AuthenticationRequiredError, requireCurrentUser } from "@/server/auth/current-user";
import { AccountPrivacyError, deleteAccount } from "@/server/account/privacy";
import { consumeRateLimit, RateLimitExceededError, rateLimitErrorResponse } from "@/server/security/rate-limit";

function failure(status: number, code: string, message: string) {
  const body: ApiError = { success: false, error: { code, message } };
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    await consumeRateLimit("account:delete", user.id, { windowSeconds: 3600, max: 3 });
    const body = await request.json() as Record<string, unknown>;
    if (body.confirmation !== "DELETE MY ACCOUNT") {
      return failure(400, "DELETE_CONFIRMATION_REQUIRED", 'Type "DELETE MY ACCOUNT" to confirm permanent deletion.');
    }
    await deleteAccount(user.id);
    return NextResponse.json(
      { success: true, data: { deleted: true } },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    if (error instanceof AuthenticationRequiredError) return failure(401, error.code, error.message);
    if (error instanceof AccountPrivacyError) return failure(error.status, error.code, error.message);
    if (error instanceof SyntaxError) return failure(400, "INVALID_JSON", "Request body must be valid JSON.");
    console.error("Account deletion failed", error);
    return failure(500, "ACCOUNT_DELETE_FAILED", "Account could not be deleted.");
  }
}
