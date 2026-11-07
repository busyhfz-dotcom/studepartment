import type { ResearchAssistantCitation } from "../../src/lib/api-contracts";

const publicSource: ResearchAssistantCitation = { id: "S2", type: "opportunity", label: "Synthetic public fellowship", detail: "A synthetic public molecular biology fellowship.", evidence: "source-backed", href: "https://example.org/public-fellowship" };
export const runtime = {
  publicSources: [publicSource],
  limits: [] as Array<{ scope: string; subject: string; max: number }>,
  quotaExceeded: false,
};
export class ResearchAssistantContextError extends Error {}
export class RateLimitExceededError extends Error {}
export async function consumeRateLimit(scope: string, subject: string, rule: { max: number }) {
  runtime.limits.push({ scope, subject, max: rule.max });
  if (runtime.quotaExceeded) throw new RateLimitExceededError();
}
export async function buildResearchAssistantContext() {
  const privateSource: ResearchAssistantCitation = { id: "S1", type: "identity", label: "PRIVATE TEST IDENTITY", detail: "PRIVATE TEST PROFILE", evidence: "asserted" };
  return { context: "PRIVATE TEST PROFILE", citations: [privateSource, publicSource], publicCitations: runtime.publicSources, limitations: [], target: undefined };
}
