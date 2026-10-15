import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import type { ApiError, ApiSuccess } from "@/lib/api-contracts";
import { runOpportunitySync, type SyncSummary } from "@/server/opportunities/sources/sync";
import { consumeRateLimit, RateLimitExceededError, rateLimitErrorResponse } from "@/server/security/rate-limit";

export const maxDuration = 900;

function secureEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function unauthorized() {
  const body: ApiError = { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized." } };
  return NextResponse.json(body, { status: 401 });
}

/**
 * Runs the opportunity sources now. The server also runs them on its own
 * schedule (see sources/scheduler.ts); this route is for an external scheduler
 * or an operator. Optional query: ?source=grants-gov,eu-funding-tenders&force=true
 */
export async function POST(request: NextRequest) {
  const configuredToken = process.env.OPPORTUNITY_INGEST_TOKEN;
  if (!configuredToken) {
    const body: ApiError = { success: false, error: { code: "INGEST_NOT_CONFIGURED", message: "Opportunity sync is not configured." } };
    return NextResponse.json(body, { status: 503 });
  }
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ") || !secureEqual(authorization.slice(7), configuredToken)) return unauthorized();

  try {
    await consumeRateLimit("jobs:opportunity-sync", "token:" + configuredToken, { windowSeconds: 300, max: 6 });
    const only = request.nextUrl.searchParams.get("source")?.split(",").map((value) => value.trim()).filter(Boolean);
    const force = request.nextUrl.searchParams.get("force") === "true";
    const data = await runOpportunitySync({ only, force });
    const body: ApiSuccess<SyncSummary> = { success: true, data };
    return NextResponse.json(body, { status: data.ran ? 200 : 409 });
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    console.error("Opportunity sync failed", error);
    const body: ApiError = { success: false, error: { code: "OPPORTUNITY_SYNC_FAILED", message: "Opportunity sync failed." } };
    return NextResponse.json(body, { status: 500 });
  }
}
