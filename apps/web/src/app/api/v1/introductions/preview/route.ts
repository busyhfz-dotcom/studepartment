import { NextResponse, type NextRequest } from "next/server";
import type { ApiError, ApiSuccess, IntroductionPurpose, ScientificIntroductionPreview } from "@/lib/api-contracts";
import { previewIntroduction } from "@/server/introductions/engine";
import { introductionErrorResponse } from "@/server/introductions/http";

const purposes = new Set<IntroductionPurpose>([
  "research-discussion",
  "collaboration",
  "mentorship",
  "position-inquiry",
  "grant-partnership",
  "clinical-project",
]);

export async function GET(request: NextRequest) {
  const receiverId = (request.nextUrl.searchParams.get("researcher") ?? "").trim();
  const purposeValue = request.nextUrl.searchParams.get("purpose") ?? "collaboration";
  if (!receiverId || !purposes.has(purposeValue as IntroductionPurpose)) {
    const body: ApiError = {
      success: false,
      error: { code: "INVALID_PREVIEW_REQUEST", message: "Researcher and valid purpose are required." },
    };
    return NextResponse.json(body, { status: 400 });
  }

  try {
    const data = await previewIntroduction(receiverId, purposeValue as IntroductionPurpose);
    const body: ApiSuccess<ScientificIntroductionPreview> = { success: true, data };
    return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return introductionErrorResponse(error);
  }
}
