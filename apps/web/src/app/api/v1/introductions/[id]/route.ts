import { NextResponse, type NextRequest } from "next/server";
import type { ApiError, ApiSuccess, IntroductionAction } from "@/lib/api-contracts";
import { actOnIntroduction } from "@/server/introductions/engine";
import { introductionErrorResponse } from "@/server/introductions/http";
import {
  consumeClientRateLimit,
  RateLimitExceededError,
  rateLimitErrorResponse,
} from "@/server/security/rate-limit";

const actions = new Set<IntroductionAction>(["accept", "decline", "withdraw"]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await consumeClientRateLimit(request, "introductions:action", { windowSeconds: 600, max: 60 });
    const { id } = await params;
    const raw = await request.json() as Record<string, unknown>;
    if (typeof raw.action !== "string" || !actions.has(raw.action as IntroductionAction)) {
      const body: ApiError = {
        success: false,
        error: { code: "INVALID_INTRODUCTION_ACTION", message: "A valid introduction action is required." },
      };
      return NextResponse.json(body, { status: 400 });
    }
    const data = await actOnIntroduction(id, raw.action as IntroductionAction);
    const body: ApiSuccess<typeof data> = { success: true, data };
    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    return introductionErrorResponse(error);
  }
}
