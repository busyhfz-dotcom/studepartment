import { ResearchAssistantConfigurationError, ResearchAssistantUpstreamError } from "./openai-provider";

export const DEFAULT_GEMINI_ASSISTANT_MODEL = "gemini-3.1-flash-lite";

export function geminiAssistantModel() {
  const model = process.env.GEMINI_ASSISTANT_MODEL?.trim() || DEFAULT_GEMINI_ASSISTANT_MODEL;
  if (!/^gemini-[a-z0-9.-]+$/.test(model)) {
    throw new ResearchAssistantConfigurationError("The Gemini assistant model is invalid.");
  }
  return model;
}

export async function generateGeminiResearchAnswer(args: { instructions: string; input: string }) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new ResearchAssistantConfigurationError();
  const model = geminiAssistantModel();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: args.instructions }] },
        contents: [{ role: "user", parts: [{ text: args.input }] }],
        generationConfig: { maxOutputTokens: 1800 },
      }),
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      console.warn("Gemini request rejected", { httpStatus: response.status });
      throw new ResearchAssistantUpstreamError(response.status === 429
        ? "Gemini has reached its current request limit. Try again later."
        : "Gemini is temporarily unavailable.");
    }
    const payload = await response.json() as {
      candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
      promptFeedback?: { blockReason?: string };
    };
    const candidate = payload.candidates?.[0];
    if (payload.promptFeedback?.blockReason || candidate?.finishReason !== "STOP") {
      console.warn("Gemini response incomplete", { blocked: Boolean(payload.promptFeedback?.blockReason), completed: candidate?.finishReason === "STOP" });
      throw new ResearchAssistantUpstreamError("Gemini did not return a complete research answer.");
    }
    const answer = candidate.content?.parts?.filter((part) => !part.thought && typeof part.text === "string")
      .map((part) => part.text).join("\n").trim();
    if (!answer) throw new ResearchAssistantUpstreamError("Gemini returned no research answer.");
    return { answer, model };
  } catch (error) {
    if (error instanceof ResearchAssistantUpstreamError) throw error;
    console.warn("Gemini transport failed", { timedOut: controller.signal.aborted });
    // Never expose the upstream body, headers, key or transport exception to the client/logs.
    throw new ResearchAssistantUpstreamError(controller.signal.aborted
      ? "Gemini took too long to respond. Try again later."
      : "Gemini is temporarily unavailable.");
  } finally {
    clearTimeout(timeout);
  }
}
