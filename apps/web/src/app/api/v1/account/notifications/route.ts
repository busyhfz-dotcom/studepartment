import { NextResponse, type NextRequest } from "next/server";
import type { ApiError, ApiSuccess, DigestFrequencyValue, NotificationPreferencesResponse } from "@/lib/api-contracts";
import { AuthenticationRequiredError, requireCurrentUser } from "@/server/auth/current-user";
import { getNotificationPreferences, updateNotificationPreferences } from "@/server/notifications/preferences";
import { consumeClientRateLimit, RateLimitExceededError, rateLimitErrorResponse } from "@/server/security/rate-limit";

function apiError(status: number, code: string, message: string) {
  const body: ApiError = { success: false, error: { code, message } };
  return NextResponse.json(body, { status });
}

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const preferences = await getNotificationPreferences(user.id);
    const body: ApiSuccess<NotificationPreferencesResponse> = { success: true, data: preferences };
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) return apiError(401, error.code, error.message);
    console.error("Failed to load notification preferences", error);
    return apiError(500, "NOTIFICATION_PREFERENCES_READ_FAILED", "Notification preferences could not be loaded.");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await consumeClientRateLimit(request, "account:notifications", { windowSeconds: 3600, max: 60 });
    const user = await requireCurrentUser();
    const raw = await request.json() as Record<string, unknown>;
    if (raw.digestFrequency !== "weekly" && raw.digestFrequency !== "off") {
      return apiError(400, "INVALID_DIGEST_FREQUENCY", 'digestFrequency must be "weekly" or "off".');
    }
    const preferences = await updateNotificationPreferences(user.id, raw.digestFrequency as DigestFrequencyValue);
    const body: ApiSuccess<NotificationPreferencesResponse> = { success: true, data: preferences };
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    if (error instanceof AuthenticationRequiredError) return apiError(401, error.code, error.message);
    if (error instanceof SyntaxError) return apiError(400, "INVALID_JSON", "Request body must be valid JSON.");
    console.error("Failed to update notification preferences", error);
    return apiError(500, "NOTIFICATION_PREFERENCES_UPDATE_FAILED", "Notification preferences could not be updated.");
  }
}
