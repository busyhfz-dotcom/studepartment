import type {
  DiscoveryRetrievalMode,
  InstitutionalDiscoveryResponse,
  InstitutionalDiscoveryResult,
  ResearcherDiscoveryResponse,
  ResearcherDiscoveryResult,
} from "@/lib/api-contracts";
import { getSemanticSignals } from "./semantic-store";

const SEMANTIC_WEIGHT = 0.28;

function roundScore(value: number) {
  return Math.round(Math.max(0, Math.min(1, value)) * 1000) / 1000;
}

function blendScore(structuredScore: number, semanticScore: number) {
  return roundScore(structuredScore * (1 - SEMANTIC_WEIGHT) + semanticScore * SEMANTIC_WEIGHT);
}

function researcherAlignment(score: number): ResearcherDiscoveryResult["alignment"] {
  if (score >= 0.75) return "strong";
  if (score >= 0.5) return "relevant";
  return "complementary";
}

function semanticReason(score: number) {
  return `Semantic similarity: ${Math.round(score * 100)}%`;
}

export async function rerankResearcherDiscovery(
  response: ResearcherDiscoveryResponse,
): Promise<ResearcherDiscoveryResponse> {
  const signals = await getSemanticSignals(
    "researcher",
    response.query.text,
    response.results.map((result) => result.id),
  );

  if (signals.mode !== "hybrid") {
    return { ...response, retrievalMode: "structured-lexical" };
  }

  const results = response.results
    .map((result) => {
      const semantic = signals.scores.get(result.id);
      if (semantic === undefined) return result;
      const score = blendScore(result.score, semantic);
      return {
        ...result,
        score,
        alignment: researcherAlignment(score),
        reasons: [semanticReason(semantic), ...result.reasons].slice(0, 4),
        scoreBreakdown: { ...result.scoreBreakdown, semantic },
      };
    })
    .sort((left, right) => right.score - left.score || left.fullName.localeCompare(right.fullName));

  return { ...response, results, retrievalMode: "hybrid" };
}

export async function rerankInstitutionalDiscovery(
  response: InstitutionalDiscoveryResponse,
): Promise<InstitutionalDiscoveryResponse> {
  const entityType = response.query.entityType;
  const signals = await getSemanticSignals(
    entityType,
    response.query.text,
    response.results.map((result) => result.id),
  );

  if (signals.mode !== "hybrid") {
    return { ...response, retrievalMode: "structured-lexical" };
  }

  const results: InstitutionalDiscoveryResult[] = response.results
    .map((result) => {
      const semantic = signals.scores.get(result.id);
      if (semantic === undefined) return result;
      return {
        ...result,
        score: blendScore(result.score, semantic),
        reasons: [semanticReason(semantic), ...result.reasons].slice(0, 4),
        scoreBreakdown: { ...result.scoreBreakdown, semantic },
      };
    })
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));

  const retrievalMode: DiscoveryRetrievalMode = "hybrid";
  return { ...response, results, retrievalMode };
}
