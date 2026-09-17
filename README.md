# Studepartment

**Medical Research Intelligence Platform** — a privacy-first scientific discovery and collaboration workspace for researchers, laboratories, institutions and research opportunities.

Studepartment is intentionally not a social network. It is designed to reduce the fragmentation around scientific identity, opportunity discovery and meaningful research introductions while keeping recommendations explainable and researcher-controlled.

## What is implemented in this MVP foundation

The repository now contains an executable Next.js product foundation rather than only a product concept:

- polished marketing experience that communicates the scientific infrastructure thesis;
- researcher workspace/dashboard with contextual activity and opportunity analysis;
- scientific researcher discovery with non-competitive profile presentation;
- opportunity intelligence for PhD, postdoc, fellowship, grant and collaboration workflows;
- controlled-introduction experience that avoids unrestricted cold messaging;
- researcher profile and privacy/visibility concepts;
- explainable matching abstraction with a deterministic zero-key demo provider;
- validated API boundaries for match analysis and introduction requests;
- PostgreSQL/Prisma domain model for identity, institutions, labs, topics, publications, opportunities, introductions and audit events;
- local PostgreSQL Docker setup, seed data, unit tests and GitHub Actions CI.

## Product principles

1. **Scientific context over engagement.** No likes, follower counts or engagement loops.
2. **Explainable intelligence.** Recommendations expose useful scientific signals instead of a mysterious global score.
3. **Human decision-making.** AI supports evaluation; it does not make hiring, eligibility or collaboration decisions.
4. **Controlled connection.** Discovery can lead to an introduction request, but private conversation requires recipient acceptance.
5. **Privacy by design.** Scientific visibility, verified identity, contact data and private communication are distinct data levels.

## Current architecture

```text
Next.js App Router + TypeScript
├── Marketing product surface
├── Researcher workspace
├── Route handlers / validated API boundaries
├── AI provider abstraction
│   └── deterministic demo intelligence (no API key)
├── Prisma domain model
└── PostgreSQL
```

Primary implementation direction:

- **Web:** Next.js 15, React 19, TypeScript
- **Data:** PostgreSQL + Prisma
- **Validation:** Zod
- **AI:** provider-independent `ResearchIntelligenceProvider`
- **Testing:** Vitest + strict TypeScript + ESLint
- **CI:** GitHub Actions quality pipeline

The `SemanticDocument` model establishes an application-level semantic index contract using portable float embeddings for the MVP. A production retrieval phase should migrate this storage to `pgvector` (or a dedicated vector service) and add hybrid lexical/vector retrieval plus graph expansion.

## Run locally

Requirements: Node.js 20.11+ and Docker.

```bash
cp .env.example .env
npm install
docker compose up -d
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

The product UI deliberately uses demo data so the complete workspace can be evaluated even before a database is started. Database-backed repositories can replace the demo adapter incrementally.

## Quality checks

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

CI runs the same checks for `main`, feature branches and pull requests.

## Important routes

| Route | Purpose |
| --- | --- |
| `/` | Product positioning and architecture narrative |
| `/dashboard` | Researcher intelligence workspace |
| `/discover` | Researcher discovery |
| `/opportunities` | Opportunity intelligence |
| `/network` | Controlled introduction workflow |
| `/profile` | Scientific identity and privacy settings concept |
| `/api/health` | Health endpoint |
| `/api/intelligence/match` | Validated explainable-match API |
| `/api/introductions` | Validated controlled-introduction API contract |

## AI design

UI and API code depend on the `ResearchIntelligenceProvider` interface rather than a model vendor. The current provider is deterministic and transparent so that the application:

- works with zero external credentials;
- is testable and reproducible;
- demonstrates the explanation contract before an LLM is introduced;
- can later route summarization, embeddings and match explanations to production services without rewriting product surfaces.

A production AI integration should preserve structured outputs, source/provenance references, observability, redaction rules, prompt/version tracking and explicit uncertainty handling.

## Data and privacy model

Core entities include `User`, `Researcher`, `Institution`, `Lab`, `ResearchTopic`, `Publication`, `Opportunity`, `IntroductionRequest`, `SemanticDocument` and `AuditEvent`.

Before production launch, complete the security layer with:

- real authentication and session management;
- authorization policies per entity/action;
- rate limiting and abuse prevention;
- encrypted storage for sensitive contact/private communication data;
- consent and deletion workflows;
- audit log retention policy;
- regional/privacy review appropriate to deployment and research partners.

## MVP boundaries

This branch is a production-minded **foundation**, not a claim that the full scientific network is production-ready. The UI, domain model and service contracts are intentionally ahead of external integrations. ORCID synchronization, publication ingestion, live grant/job feeds, institutional verification, real messaging, vector infrastructure and a production AI provider remain integration phases.

## Recommended next implementation phases

### Phase A — real identity and persistence
Authentication, researcher onboarding, ORCID connection, database repositories and visibility controls.

### Phase B — retrieval intelligence
Publication ingestion, normalized taxonomy, embeddings, hybrid search and measured retrieval quality.

### Phase C — opportunity ingestion
Trusted source connectors, deduplication, deadline normalization and user-controlled watchlists.

### Phase D — controlled network
Persisted introduction requests, recipient consent, notification delivery, abuse controls and private conversations.

### Phase E — institutional platform
Lab/institution administration, verified organization identities, collaboration maps and aggregate analytics with privacy safeguards.

---

The north-star product outcome is not time spent in the app. It is **less friction between a serious scientific intent and a trustworthy next step**.
