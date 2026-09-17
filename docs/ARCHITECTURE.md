# Studepartment Architecture

## 1. Architectural goal

Studepartment should evolve as scientific infrastructure rather than a social feed. The architecture therefore separates **identity**, **discovery**, **intelligence**, **connection**, and **private communication** so that each can be secured, measured and replaced independently.

## 2. Application layers

### Product surface

Next.js App Router renders the marketing experience and researcher workspace. Product pages currently consume a deterministic demo repository so the interface remains evaluable without infrastructure dependencies.

### Domain/data layer

Prisma models the first durable graph of:

`Researcher ↔ Publication ↔ Topic ↔ Lab ↔ Institution ↔ Opportunity`

Relationship tables preserve explicit scientific links and allow future graph projection without forcing a graph database into the first MVP.

### Intelligence layer

`ResearchIntelligenceProvider` is the application boundary for explainable scientific intelligence. The demo implementation is deterministic and zero-key. A production provider should implement structured model outputs, retrieval provenance, uncertainty metadata and observability while keeping the calling interface stable.

### Connection layer

Introduction requests are intentionally distinct from private conversations. The product should never infer that discovering a researcher grants unrestricted messaging access.

## 3. Recommended production decomposition

Start as a modular monolith. Split services only when load, data governance or team boundaries justify it.

```text
web
 ├─ identity module
 ├─ discovery module
 ├─ opportunity module
 ├─ introduction module
 ├─ intelligence module
 └─ audit module

workers
 ├─ publication ingestion
 ├─ opportunity ingestion
 ├─ embedding/index updates
 └─ notification delivery

storage
 ├─ PostgreSQL (source of truth)
 ├─ object storage (documents, if introduced)
 └─ pgvector / vector service (retrieval index)
```

## 4. Search evolution

### MVP

Structured topic/method filters plus demo semantic signals.

### Retrieval phase

1. normalize entities and scientific taxonomy;
2. generate embeddings for safe public/authorized text;
3. hybrid lexical + vector candidate retrieval;
4. graph expansion around publications/topics/institutions;
5. policy filtering based on visibility and consent;
6. explain/rerank candidates using explicit signals;
7. measure retrieval quality with a human-reviewed benchmark set.

No universal researcher quality score should be introduced. Ranking inside a user query may optimize relevance to that query, but the explanation layer should expose why.

## 5. Authentication and authorization

Authentication is deliberately not faked as production auth in the first commit. Add a supported session provider, then centralize policy checks such as:

- can view full researcher profile;
- can view controlled contact data;
- can request an introduction;
- can accept/decline an introduction;
- can administer an institution/lab;
- can modify opportunity data.

Authorization belongs in server-side domain functions, not only in UI conditionals.

## 6. Privacy boundaries

Treat these as separate classes:

1. public scientific facts;
2. verified scientific identity;
3. user-controlled profile fields;
4. controlled contact information;
5. private introduction/context messages;
6. private conversation content;
7. internal safety/audit data.

Each class should have its own retention, export, deletion and access policies.

## 7. Observability

Before production, add request tracing and domain metrics for successful discovery, introduction acceptance, false-positive recommendations, search abandonment, ingestion errors and policy denials. Avoid optimizing generic time-on-site or engagement.
