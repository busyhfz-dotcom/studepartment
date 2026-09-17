import type { MatchExplanation, Opportunity, Researcher } from "@/lib/types";

export type OpportunityMatchInput = {
  researcher: Researcher;
  opportunity: Opportunity;
};

export interface ResearchIntelligenceProvider {
  explainOpportunityMatch(input: OpportunityMatchInput): Promise<MatchExplanation>;
}
