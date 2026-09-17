# Semantic retrieval operations

Studepartment Discovery uses a hybrid retrieval architecture with a safe structured-lexical fallback.

## Storage

The `20260918_vector_retrieval_v1` migration enables pgvector and creates `DiscoveryEmbedding` with a fixed `vector(1536)` column and an HNSW cosine index.

The vector table is intentionally accessed through parameterized raw SQL. The core Prisma domain schema remains focused on canonical research entities and does not expose pgvector-specific types to product repositories.

## Embedding provider

Semantic retrieval is optional. Configure:

```env
OPENAI_API_KEY="..."
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
```

The runtime always requests 1536 dimensions so the storage contract remains stable. Discovery does not fail when the provider is absent or unavailable; it reports and uses `structured-lexical` retrieval instead.

## Build or refresh the index

After applying migrations and configuring the embedding provider, run:

```bash
pnpm discovery:index
```

The indexer builds canonical search documents for:

- public researcher identities
- laboratories and their public members
- institutions, laboratories, and current public affiliations

Each document is content-hashed. Only changed documents are re-embedded, and stale rows are removed for the active embedding model.

Run the command after meaningful identity, affiliation, topic, method, laboratory, or institution imports. A scheduled or event-driven index refresh can replace this manual operational step later without changing the retrieval API.

## Runtime ranking

Search first applies the existing structured filters and explainable lexical ranking. When both a query embedding and matching indexed candidate embeddings are available, semantic cosine similarity contributes 28% of the re-ranking score.

The API exposes `retrievalMode` as either:

- `structured-lexical`
- `hybrid`

No semantic capability is claimed unless vector similarity actually participated in ranking.

## CI and local PostgreSQL

CI uses the official pgvector PostgreSQL 16 image so fresh migration validation covers the vector extension and HNSW index. A local PostgreSQL server must also have pgvector installed before running the migration.
