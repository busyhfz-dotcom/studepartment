import { NextResponse, type NextRequest } from "next/server";
import type { ApiError, ApiSuccess, IntroductionPolicyResponse, IntroductionPurpose } from "@/lib/api-contracts";
import { getIntroductionPolicy, updateIntroductionPolicy } from "@/server/introductions/engine";
import { introductionErrorResponse } from "@/server/introductions/http";

const purposes = new Set<IntroductionPurpose>([
  "research-discussion",
  "collaboration",
  "mentorship",
  "position-inquiry",
  "grant-partnership",
  "clinical-project",
]);

export async function GET() {
  try {
    const data = await getIntroductionPolicy();
    const body: ApiSuccess<IntroductionPolicyResponse> = { success: true, data };
    return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return introductionErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const raw = await request.json() as Record<string, unknown>;
    const allowedPurposes = Array.isArray(raw.allowedPurposes)
      ? raw.allowedPurposes.filter(
          (value): value is IntroductionPurpose => typeof value === "string" && purposes.has(value as IntroductionPurpose),
        )
      : null;

    if (
      typeof raw.allowIntroductions !== "boolean" ||
      typeof raw.requireVerifiedSender !== "boolean" ||
      !allowedPurposes ||
      typeof raw.cooldownDays !== "number" ||
      typeof raw.maxInboundPerDay !== "number"
    ) {
      const body: ApiError = {
        success: false,
        error: { code: "INVALID_INTRODUCTION_POLICY", message: "Invalid introduction policy." },
      };
      return NextResponse.json(body, { status: 400 });
    }

    const input: IntroductionPolicyResponse = {
      allowIntroductions: raw.allowIntroductions,
      requireVerifiedSender: raw.requireVerifiedSender,
      allowedPurposes,
      cooldownDays: raw.cooldownDays,
      maxInboundPerDay: raw.maxInboundPerDay,
    };
    const data = await updateIntroductionPolicy(input);
    const body: ApiSuccess<IntroductionPolicyResponse> = { success: true, data };
    return NextResponse.json(body);
  } catch (error) {
    return introductionErrorResponse(error);
  }
}
