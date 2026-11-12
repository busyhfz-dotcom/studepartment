import { generateGeminiResearchAnswer } from "./gemini-provider";
import { generateGroundedResearchAnswer as generateOpenAIResearchAnswer } from "./openai-provider";

export function researchAssistantProvider(): "gemini" | "openai" | null {
  if (process.env.GEMINI_API_KEY?.trim()) return "gemini";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  return null;
}

export function assistantDailyRequestLimit() {
  const raw = process.env.ASSISTANT_DAILY_REQUEST_LIMIT?.trim();
  if (!raw) return 50;
  const parsed = Number(raw);
  return /^\d+$/.test(raw) && Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 1000 ? parsed : 0;
}

/**
 * Interface translation is callable without an account, so it draws on its own
 * daily allowance. Sharing the Research Assistant's allowance let anonymous
 * visitors exhaust it and switch the assistant off for signed-in members.
 * Set ASSISTANT_DAILY_REQUEST_LIMIT=0 to disable every AI call, including this one.
 */
export function translationDailyRequestLimit() {
  const assistantLimit = assistantDailyRequestLimit();
  if (!assistantLimit) return 0;
  const raw = process.env.INTERFACE_TRANSLATION_DAILY_LIMIT?.trim();
  if (!raw) return assistantLimit;
  const parsed = Number(raw);
  return /^\d+$/.test(raw) && Number.isSafeInteger(parsed) && parsed <= 1000 ? parsed : 0;
}

export function generateResearchAnswer(args: { instructions: string; input: string }) {
  // Never switch to a different provider (or a paid model) after a Gemini failure.
  return researchAssistantProvider() === "gemini"
    ? generateGeminiResearchAnswer(args)
    : generateOpenAIResearchAnswer(args);
}
