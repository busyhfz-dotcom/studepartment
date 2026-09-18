import { NextResponse } from "next/server";
import type { AccountActivitySummary, ApiError, ApiSuccess } from "@/lib/api-contracts";
import { AuthenticationRequiredError, requireCurrentUser } from "@/server/auth/current-user";
import { accountActivitySummary } from "@/server/account/privacy";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const data = await accountActivitySummary(user.id);
    const body: ApiSuccess<AccountActivitySummary> = { success: true, data };
    return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      const body: ApiError = { success: false, error: { code: error.code, message: error.message } };
      return NextResponse.json(body, { status: 401, headers: { "Cache-Control": "private, no-store" } });
    }
    console.error("Account activity summary failed", error);
    const body: ApiError = { success: false, error: { code: "ACCOUNT_ACTIVITY_FAILED", message: "Activity summary could not be loaded." } };
    return NextResponse.json(body, { status: 500, headers: { "Cache-Control": "private, no-store" } });
  }
}
