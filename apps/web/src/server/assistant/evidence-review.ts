import type { ResearchAssistantCitation } from "@/lib/api-contracts";

/** A transparent source summary, usable while generated analysis is unavailable. */
export function reviewAvailableEvidence(question: string, citations: ResearchAssistantCitation[]) {
  const words = new Set(question.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []);
  const requestedType = /opportunit|grant|funding|position|eligib/.test(question.toLowerCase()) ? "opportunity"
    : /institution|universit|hospital/.test(question.toLowerCase()) ? "institution"
    : /researcher|collaborat|mentor/.test(question.toLowerCase()) ? "researcher"
    : /publication|paper|work/.test(question.toLowerCase()) ? "publication" : undefined;
  const selected = citations.map((citation, index) => {
    const terms = new Set((citation.label + " " + citation.detail).toLowerCase().match(/[a-z0-9]{3,}/g) ?? []);
    const overlap = [...words].filter((word) => terms.has(word)).length;
    return { citation, index, overlap: overlap + (citation.type === requestedType ? 20 : 0) };
  }).sort((a, b) => b.overlap - a.overlap || a.index - b.index).slice(0, 8).map((item) => item.citation);
  const gaps = requestedType && !citations.some((citation) => citation.type === requestedType)
    ? `No ${requestedType} records are available in this request's source context. Broaden your search or add relevant profile information.`
    : "Review the linked sources for current requirements and contact routes before taking action.";
  return {
    answer: "Available evidence for your question\n\n" + selected.map((citation) => `${citation.label}: ${citation.detail} [${citation.id}]`).join("\n\n") + "\n\nNext step: " + gaps,
    citations: selected,
    referencedCitationIds: selected.map((citation) => citation.id),
    model: "evidence-review",
    mode: "evidence-review" as const,
  };
}
