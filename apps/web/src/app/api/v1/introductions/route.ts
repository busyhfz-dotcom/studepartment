import { NextResponse, type NextRequest } from "next/server";
import type {
  ApiError,
  ApiSuccess,
  CreateIntroductionInput,
  IntroductionListResponse,
  IntroductionPurpose,
} from "@/lib/api-contracts";
import { createIntroduction, listIntroductions } from "@/server/introductions/engine";
import { canUseProFeature, requireCurrentUser } from "@/server/auth/current-user";
import { recordProductEvent } from "@/server/analytics/product-events";
import { introductionErrorResponse } from "@/server/introductions/http";
import { assertFileOrigin } from "@/server/files/http";
import { FileError } from "@/server/files/validation";
import {
  consumeClientRateLimit,
  RateLimitExceededError,
  rateLimitErrorResponse,
} from "@/server/security/rate-limit";

const purposes = new Set<IntroductionPurpose>([
  "research-discussion",
  "collaboration",
  "mentorship",
  "position-inquiry",
  "grant-partnership",
  "clinical-project",
]);

export async function GET(request: NextRequest) {
  const box = request.nextUrl.searchParams.get("box") === "outbox" ? "outbox" : "inbox";
  try {
    const data = await listIntroductions(box);
    const body: ApiSuccess<IntroductionListResponse> = { success: true, data };
    return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    return introductionErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await consumeClientRateLimit(request, "introductions:create", { windowSeconds: 600, max: 20 });
    const sender = await requireCurrentUser();
    assertFileOrigin(request);
    if (!canUseProFeature(sender)) return NextResponse.json({ success: false, error: { code: "PRO_REQUIRED", message: "Sending scientific introductions requires Studepartment Pro." } }, { status: 402 });
    const raw = await request.json() as Record<string, unknown>;
    if (
      typeof raw.receiverId !== "string" ||
      typeof raw.purpose !== "string" ||
      !purposes.has(raw.purpose as IntroductionPurpose) ||
      typeof raw.context !== "string" ||
      (raw.attachmentIds !== undefined && (!Array.isArray(raw.attachmentIds) || raw.attachmentIds.length > 5 || raw.attachmentIds.some((id) => typeof id !== "string" || !/^[a-zA-Z0-9-]{20,80}$/.test(id))))
    ) {
      const body: ApiError = {
        success: false,
        error: { code: "INVALID_INTRODUCTION", message: "Receiver, purpose, and context are required." },
      };
      return NextResponse.json(body, { status: 400 });
    }

    const input: CreateIntroductionInput = {
      receiverId: raw.receiverId.trim(),
      purpose: raw.purpose as IntroductionPurpose,
      context: raw.context,
      attachmentIds: raw.attachmentIds as string[] | undefined,
    };
    const data = await createIntroduction(input);
    await recordProductEvent(sender.id, "INTRODUCTION_SENT", { type: "researcher", id: input.receiverId });
    const body: ApiSuccess<typeof data> = { success: true, data };
    return NextResponse.json(body, { status: 201 });
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    if (error instanceof FileError) return NextResponse.json({ success: false, error: { code: "INVALID_ORIGIN", message: error.message } }, { status: error.status });
    return introductionErrorResponse(error);
  }
}
