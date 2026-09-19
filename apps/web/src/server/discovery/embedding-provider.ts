export const DISCOVERY_EMBEDDING_DIMENSIONS = 1536;
export const DEFAULT_DISCOVERY_EMBEDDING_MODEL = "text-embedding-3-small";

type OpenAIEmbeddingResponse = {
  data?: Array<{
    index?: number;
    embedding?: number[];
  }>;
};

export interface DiscoveryEmbeddingProvider {
  readonly provider: "openai";
  readonly model: string;
  readonly dimensions: number;
  embed(inputs: string[]): Promise<number[][]>;
}

function assertEmbedding(value: unknown, dimensions: number): asserts value is number[] {
  if (!Array.isArray(value) || value.length !== dimensions || value.some((item) => typeof item !== "number" || !Number.isFinite(item))) {
    throw new Error(`Embedding provider returned an invalid ${dimensions}-dimension vector.`);
  }
}

export function getDiscoveryEmbeddingProvider(): DiscoveryEmbeddingProvider | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.OPENAI_EMBEDDING_MODEL?.trim() || DEFAULT_DISCOVERY_EMBEDDING_MODEL;

  return {
    provider: "openai",
    model,
    dimensions: DISCOVERY_EMBEDDING_DIMENSIONS,
    async embed(inputs) {
      if (!inputs.length) return [];

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      try {
        const response = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            input: inputs,
            encoding_format: "float",
            dimensions: DISCOVERY_EMBEDDING_DIMENSIONS,
          }),
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Embedding provider request failed with status ${response.status}.`);
        }

        const body = (await response.json()) as OpenAIEmbeddingResponse;
        const rows = [...(body.data ?? [])].sort((left, right) => (left.index ?? 0) - (right.index ?? 0));
        if (rows.length !== inputs.length) {
          throw new Error("Embedding provider returned an unexpected number of vectors.");
        }

        return rows.map((row) => {
          assertEmbedding(row.embedding, DISCOVERY_EMBEDDING_DIMENSIONS);
          return row.embedding;
        });
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
