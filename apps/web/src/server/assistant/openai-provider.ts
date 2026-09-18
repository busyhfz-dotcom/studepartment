export const DEFAULT_RESEARCH_ASSISTANT_MODEL = "gpt-5.6-luna";

export class ResearchAssistantConfigurationError extends Error {
  readonly code = "RESEARCH_ASSISTANT_NOT_CONFIGURED";
  constructor(message = "Research Assistant is not configured.") {
    super(message);
    this.name = "ResearchAssistantConfigurationError";
  }
}

export class ResearchAssistantUpstreamError extends Error {
  readonly code = "RESEARCH_ASSISTANT_UPSTREAM_FAILED";
  constructor(message: string) {
    super(message);
    this.name = "ResearchAssistantUpstreamError";
  }
}

function outputText(payload: Record<string, unknown>) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const output = Array.isArray(payload.output) ? payload.output : [];
  const chunks: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as Record<string, unknown>).content)
      ? (item as Record<string, unknown>).content as unknown[]
      : [];
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const record = part as Record<string, unknown>;
      if (record.type === "output_text" && typeof record.text === "string") {
        chunks.push(record.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

export async function generateGroundedResearchAnswer(args: {
  instructions: string;
  input: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new ResearchAssistantConfigurationError();

  const model = process.env.OPENAI_ASSISTANT_MODEL?.trim() || DEFAULT_RESEARCH_ASSISTANT_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: "Bearer " + apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        store: false,
        instructions: args.instructions,
        input: args.input,
        max_output_tokens: 1400,
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ResearchAssistantUpstreamError(
        "Research Assistant provider returned HTTP " + response.status + ".",
      );
    }

    const payload = await response.json() as Record<string, unknown>;
    const answer = outputText(payload);
    if (!answer) throw new ResearchAssistantUpstreamError("Research Assistant provider returned no text.");
    return { answer, model };
  } catch (error) {
    if (error instanceof ResearchAssistantConfigurationError || error instanceof ResearchAssistantUpstreamError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new ResearchAssistantUpstreamError("Research Assistant provider timed out.");
    }
    throw new ResearchAssistantUpstreamError("Research Assistant provider request failed.");
  } finally {
    clearTimeout(timeout);
  }
}
