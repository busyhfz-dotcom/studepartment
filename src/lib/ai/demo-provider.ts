import type { ResearchIntelligenceProvider } from "@/lib/ai/contracts";
import { explainDeterministicMatch } from "@/lib/ai/scoring";

export const demoIntelligenceProvider: ResearchIntelligenceProvider = {
  async explainOpportunityMatch({ researcher, opportunity }) {
    return explainDeterministicMatch(researcher, opportunity);
  },
};
