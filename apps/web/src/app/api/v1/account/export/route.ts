import { NextResponse, type NextRequest } from "next/server";
import type { ApiError } from "@/lib/api-contracts";
import { AuthenticationRequiredError, requireCurrentUser } from "@/server/auth/current-user";
import { AccountPrivacyError, exportAccountData } from "@/server/account/privacy";
import { consumeClientRateLimit, RateLimitExceededError, rateLimitErrorResponse } from "@/server/security/rate-limit";

function failure(status: number, code: string, message: string) {
  const body: ApiError = { success: false, error: { code, message } };
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: NextRequest) {
  try {
    await consumeClientRateLimit(request, "account:export", { windowSeconds: 3600, max: 5 });
    const user = await requireCurrentUser();
    const data = await exportAccountData(user.id);
    const date = new Date().toISOString().slice(0, 10);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": 'attachment; filename="studepartment-account-export-' + date + '.json"',
      },
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    if (error instanceof AuthenticationRequiredError) return failure(401, error.code, error.message);
    if (error instanceof AccountPrivacyError) return failure(error.status, error.code, error.message);
    console.error("Account export failed", error);
    return failure(500, "ACCOUNT_EXPORT_FAILED", "Account export could not be generated.");
  }
}
