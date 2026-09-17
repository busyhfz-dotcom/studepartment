import type { MatchExplanation, Opportunity, Researcher } from "@/lib/types";

const normalize = (value: string) => value.trim().toLowerCase();

export function sharedTopics(researcher: Researcher, opportunity: Opportunity) {
  const researchTopics = new Set(researcher.topics.map(normalize));
  return opportunity.topics.filter((topic) => researchTopics.has(normalize(topic)));
}

export function explainDeterministicMatch(
  researcher: Researcher,
  opportunity: Opportunity,
): MatchExplanation {
  const overlap = sharedTopics(researcher, opportunity);
  const methodTerms = researcher.methods.map(normalize);
  const methodOverlap = opportunity.summary
    .split(/\W+/)
    .map(normalize)
    .filter((word) => methodTerms.some((method) => method.includes(word) || word.includes(method)));

  const signals: MatchExplanation["signals"] = [];

  if (overlap.length > 0) {
    signals.push({
      label: "Research context",
      strength: "high",
      detail: `Shared scientific focus: ${overlap.join(", ")}.`,
    });
  }

  if (methodOverlap.length > 0 || opportunity.summary.toLowerCase().includes("spatial")) {
    signals.push({
      label: "Method compatibility",
      strength: "high",
      detail: "The opportunity calls for methods that are represented in the researcher's recent toolkit.",
    });
  }

  signals.push({
    label: "Collaboration intent",
    strength: researcher.collaborationOpen ? "medium" : "context",
    detail: researcher.collaborationOpen
      ? "The researcher is currently open to relevant scientific introductions."
      : "The researcher has limited new collaboration availability.",
  });

  const strong = overlap.length >= 2;
  const promising = overlap.length === 1 || methodOverlap.length > 0;

  return {
    verdict: strong ? "Strong alignment" : promising ? "Promising alignment" : "Contextual match",
    summary: strong
      ? "The scientific topic overlap is direct, and the opportunity is compatible with the researcher's current translational direction."
      : promising
        ? "There is a credible scientific connection, but the fit should be reviewed against project-specific expectations."
        : "The connection is exploratory and should be validated before an introduction or application.",
    signals,
    caution: "This explanation is decision support, not an automated eligibility or hiring decision.",
  };
}
