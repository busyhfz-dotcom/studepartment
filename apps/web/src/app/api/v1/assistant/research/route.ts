import { NextResponse, type NextRequest } from "next/server";
import type { ApiError, ApiSuccess, ResearchAssistantRequest, ResearchAssistantResponse } from "@/lib/api-contracts";
import { AuthenticationRequiredError, requireCurrentUser } from "@/server/auth/current-user";
import { ResearchAssistantContextError } from "@/server/assistant/context";
import {
  ResearchAssistantConfigurationError,
  ResearchAssistantUpstreamError,
} from "@/server/assistant/openai-provider";
import {
  answerResearchQuestion,
  ResearchAssistantInputError,
} from "@/server/assistant/research-assistant";
import {
  consumeClientRateLimit,
  consumeRateLimit,
  RateLimitExceededError,
  rateLimitErrorResponse,
} from "@/server/security/rate-limit";

function errorResponse(status: number, code: string, message: string) {
  const body: ApiError = { success: false, error: { code, message } };
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: NextRequest) {
  try {
    await consumeClientRateLimit(request, "research-assistant-client", {
      windowSeconds: 60,
      max: 10,
    });

    const user = await requireCurrentUser();
    await consumeRateLimit("research-assistant-user", "user:" + user.id, {
      windowSeconds: 60 * 60,
      max: 60,
    });

    const input = (await request.json()) as ResearchAssistantRequest;
    const data = await answerResearchQuestion(input, user.id);
    const body: ApiSuccess<ResearchAssistantResponse> = { success: true, data };
    return NextResponse.json(body, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) return rateLimitErrorResponse(error);
    if (error instanceof AuthenticationRequiredError) return errorResponse(401, error.code, error.message);
    if (error instanceof ResearchAssistantInputError) return errorResponse(400, error.code, error.message);
    if (error instanceof ResearchAssistantContextError) return errorResponse(error.status, error.code, error.message);
    if (error instanceof ResearchAssistantConfigurationError) return errorResponse(503, error.code, error.message);
    if (error instanceof ResearchAssistantUpstreamError) return errorResponse(502, error.code, error.message);
    console.error("Research Assistant request failed", error);
    return errorResponse(500, "RESEARCH_ASSISTANT_FAILED", "Research Assistant is temporarily unavailable.");
  }
}
