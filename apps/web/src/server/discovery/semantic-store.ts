import { getDb } from "@studepartment/db";
import { getDiscoveryEmbeddingProvider } from "./embedding-provider";

export type SemanticEntityType = "researcher" | "laboratory" | "institution";
export type DiscoveryRetrievalMode = "structured-lexical" | "hybrid";

type SemanticRow = {
  entityId: string;
  similarity: number;
};

export type SemanticSignals = {
  mode: DiscoveryRetrievalMode;
  model?: string;
  scores: Map<string, number>;
};

function vectorLiteral(vector: number[]) {
  return `[${vector.join(",")}]`;
}

function clampScore(value: number) {
  return Math.round(Math.max(0, Math.min(1, value)) * 1000) / 1000;
}

export async function getSemanticSignals(
  entityType: SemanticEntityType,
  queryText: string,
  candidateIds: string[],
): Promise<SemanticSignals> {
  const normalizedQuery = queryText.trim();
  const uniqueIds = Array.from(new Set(candidateIds)).slice(0, 100);
  const provider = getDiscoveryEmbeddingProvider();

  if (!process.env.DATABASE_URL || !provider || !normalizedQuery || !uniqueIds.length) {
    return { mode: "structured-lexical", scores: new Map() };
  }

  try {
    const [embedding] = await provider.embed([normalizedQuery]);
    if (!embedding) return { mode: "structured-lexical", scores: new Map() };

    const candidatePlaceholders = uniqueIds.map((_, index) => `$${index + 4}`).join(", ");
    const sql = `
      SELECT
        "entityId",
        GREATEST(0, LEAST(1, 1 - ("embedding" <=> $1::vector)))::float8 AS similarity
      FROM "DiscoveryEmbedding"
      WHERE "entityType" = $2
        AND "model" = $3
        AND "entityId" IN (${candidatePlaceholders})
      ORDER BY "embedding" <=> $1::vector
      LIMIT ${uniqueIds.length}
    `;

    const rows = await getDb().$queryRawUnsafe<SemanticRow[]>(
      sql,
      vectorLiteral(embedding),
      entityType,
      provider.model,
      ...uniqueIds,
    );

    if (!rows.length) return { mode: "structured-lexical", model: provider.model, scores: new Map() };

    return {
      mode: "hybrid",
      model: provider.model,
      scores: new Map(rows.map((row) => [row.entityId, clampScore(Number(row.similarity))])),
    };
  } catch (error) {
    console.warn("Semantic retrieval unavailable; using structured lexical ranking.", error);
    return { mode: "structured-lexical", model: provider.model, scores: new Map() };
  }
}
