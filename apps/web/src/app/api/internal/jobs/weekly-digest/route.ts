import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import type { ApiError, ApiSuccess } from "@/lib/api-contracts";
import { runWeeklyDigest } from "@/server/digest/weekly-digest";
import { consumeRateLimit, RateLimitExceededError, rateLimitErrorResponse } from "@/server/security/rate-limit";
import { hasSchedulerSignature } from "@/server/opportunities/sources/scheduler-signature";
import { isEmailDeliveryConfigured } from "@/server/notifications/email";

function secureEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function unauthorized(message = "Unauthorized.") {
  const body: ApiError = { success: false, error: { code: "UNAUTHORIZED", message } };
  return NextResponse.json(body, { status: 401 });
}

/**
 * Called daily by the signed Neon scheduler or an existing bearer-token
 * scheduler. Weekly matches keep their per-account cadence.
 */
export async function POST(request: NextRequest) {
  const configuredToken = process.env.DIGEST_JOB_TOKEN?.trim();
  const neonEnabled = process.env.EMAIL_DIGEST_ENABLED === "true";
  if (!isEmailDeliveryConfigured() || (!configuredToken && !neonEnabled)) {
    const body: ApiError = {
      success: false,
      error: { code: "DIGEST_JOB_NOT_CONFIGURED", message: "Weekly digest job is not configured." },
    };
    return NextResponse.json(body, { status: 503 });
  }

  const scheduled = neonEnabled && request.nextUrl.search === "" && hasSchedulerSignature(request.headers, "email-digest");
  const authorization = request.headers.get("authorization");
  if (!scheduled && (!configuredToken || !authorization?.startsWith("Bearer ") || !secureEqual(authorization.slice(7), configuredToken))) return unauthorized();

  try {
    await consumeRateLimit("jobs:weekly-digest", scheduled ? "neon-scheduler" : "token:" + configuredToken, { windowSeconds: 60, max: 4 });
    const data = await runWeeklyDigest();
    const body: ApiSuccess<typeof data> = { success: true, data };
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    console.error("Weekly digest job failed", error);
    const body: ApiError = { success: false, error: { code: "WEEKLY_DIGEST_FAILED", message: "Weekly digest job failed." } };
    return NextResponse.json(body, { status: 500 });
  }
}
