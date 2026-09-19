# Product Roadmap

Status at v1.4.0-rc.1: all repository-side milestones required for the public release candidate are implemented and validated by CI. Live production activation remains an infrastructure/credential step.

## Completed product milestones

### Foundation
- [x] Workspace and CI foundation
- [x] Authentication and authorization boundary
- [x] PostgreSQL/Prisma migration discipline
- [x] Product design system and application shell

### Scientific Identity
- [x] Researcher profile and guided onboarding
- [x] Canonical institution affiliation
- [x] Canonical topic and method taxonomies
- [x] ORCID ownership verification
- [x] Evidence provenance and verification signals
- [x] PubMed/ORCID publication enrichment

### Discovery & Matching
- [x] Researcher discovery
- [x] Laboratory discovery
- [x] Institution discovery
- [x] Structured + lexical retrieval
- [x] pgvector semantic re-ranking with explicit fallback
- [x] Explainable score components and match reasons
- [x] Availability-aware matching
- [x] Deterministic institutional-fit evidence

### Opportunity Intelligence
- [x] Canonical source-aware opportunity model
- [x] Idempotent ingestion boundary
- [x] Freshness and deadline normalization
- [x] Scientific relevance separated from formal eligibility
- [x] Personalized matching against Scientific Identity
- [x] Save workflow and configurable deadline alert policy
- [x] Grants represented as a first-class opportunity type

### Controlled Connections
- [x] Scientific introduction requests
- [x] Recipient policy and availability controls
- [x] Inbox/outbox lifecycle
- [x] Accept, decline, withdraw, expiry
- [x] Cooldowns, duplicate prevention, and persistent rate limits
- [x] No unrestricted social messaging

### Scientific Intelligence
- [x] Scientific Evidence Graph
- [x] Institutional Intelligence profiles
- [x] Grounded Research Assistant
- [x] Request-specific source ledger
- [x] Citation validation
- [x] No external browsing or hidden ranking inside the Assistant

### Public Beta Controls
- [x] Security and privacy review baseline
- [x] Persistent abuse controls
- [x] Private discovery feedback loop
- [x] Data-minimized product-event analytics
- [x] User-visible private activity summary
- [x] Account data export
- [x] Permanent account and Scientific Identity deletion
- [x] Runtime and deployment smoke coverage

## Release Candidate — v1.4.0-rc.1

The release candidate must reliably help a qualified researcher:

1. establish a trustworthy Scientific Identity;
2. discover relevant researchers, laboratories, institutions, and opportunities;
3. understand why a result is relevant;
4. distinguish scientific fit from formal eligibility;
5. inspect source provenance and evidence;
6. initiate a controlled scientific introduction;
7. use grounded AI synthesis without losing source traceability;
8. control feedback and personal data.

The repository now implements this product loop.

## Remaining live-production prerequisites

These are not repository feature gaps:

- production PostgreSQL/Neon provisioning and backup policy
- safe migration adoption for any pre-existing Neon schema
- production runtime secrets
- production ORCID application and exact HTTPS redirect URI
- optional OpenAI provider key/model configuration
- semantic discovery index generation in the target database
- opportunity ingestion token/source operations
- TLS and DNS
- trusted reverse-proxy/IP-header configuration
- platform logging/alerting and database monitoring
- deployment smoke against the final HTTPS URL

Do not describe the live deployment as production-ready until these external prerequisites have been completed and the deployment smoke passes.
