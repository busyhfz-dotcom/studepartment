import type { ResearchAssistantCitation } from "@/lib/api-contracts";

export function groundedCitationIds(answer: string, citations: ResearchAssistantCitation[]) {
  const valid = new Set(citations.map((citation) => citation.id));
  const references = Array.from(new Set(Array.from(answer.matchAll(/\[(S\d+)\]/g), (match) => match[1])));
  if (!references.length || references.some((id) => !valid.has(id))) return [];
  return references;
}
