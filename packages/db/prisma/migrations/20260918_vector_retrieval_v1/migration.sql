-- Enable pgvector for semantic retrieval.
CREATE EXTENSION IF NOT EXISTS vector;

-- Embeddings are intentionally kept outside the Prisma-managed domain models.
-- Prisma 7 does not natively model pgvector columns, so application access uses
-- parameterized raw SQL behind a dedicated retrieval boundary.
CREATE TABLE "DiscoveryEmbedding" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "dimensions" INTEGER NOT NULL DEFAULT 1536,
    "contentHash" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscoveryEmbedding_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DiscoveryEmbedding_entityType_check" CHECK ("entityType" IN ('researcher', 'laboratory', 'institution')),
    CONSTRAINT "DiscoveryEmbedding_dimensions_check" CHECK ("dimensions" = 1536)
);

CREATE UNIQUE INDEX "DiscoveryEmbedding_entity_model_key"
ON "DiscoveryEmbedding"("entityType", "entityId", "model");

CREATE INDEX "DiscoveryEmbedding_entityType_idx"
ON "DiscoveryEmbedding"("entityType");

CREATE INDEX "DiscoveryEmbedding_embedding_hnsw_idx"
ON "DiscoveryEmbedding"
USING hnsw ("embedding" vector_cosine_ops);
