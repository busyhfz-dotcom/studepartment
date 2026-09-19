# Studepartment v1.4.0-rc.1 Release Notes

This release candidate represents the completed repository-side product loop for Studepartment.

## Scientific Identity

- Better Auth session ownership mapped to canonical User and ResearcherProfile records.
- Guided Scientific Identity onboarding and editing.
- Canonical affiliations, topics, methods, career stage, availability, and collaboration intent.
- Evidence provenance with asserted, verified, disputed, and stale states.
- ORCID OAuth ownership verification.
- PubMed/ORCID publication enrichment with source-aware evidence.

## Discovery

- Researcher, laboratory, and institution discovery.
- Structured filters and lexical matching.
- pgvector-backed semantic re-ranking with structured/lexical fallback.
- Explainable score components, reasons, confidence, and availability signals.
- No follower/popularity mechanics.
- Private negative-feedback suppression for the submitting user's later results.

## Opportunity Intelligence

- Canonical source/provenance model.
- Idempotent normalized ingestion boundary.
- Deadline normalization and freshness handling.
- Scientific relevance kept separate from formal eligibility.
- Personalized matching against Scientific Identity.
- Saved opportunities and configurable deadline alert policy.
- Grants, fellowships, PhD/postdoc roles, collaborations, and research assistantships.

## Scientific Connections

- Controlled introduction requests.
- Recipient policy, verification requirements, allowed purposes, cooldowns, and inbound caps.
- Inbox/outbox lifecycle with accept, decline, withdraw, expiry, and audit events.
- Duplicate/context-reuse prevention.
- No unrestricted social messaging.

## Scientific Intelligence

- Scientific Evidence Graph.
- Institutional Intelligence profiles derived from canonical public relationships.
- Deterministic institution/identity topic, method, and opportunity overlap.
- Grounded Research Assistant using request-specific Studepartment source ledgers.
- Citation validation for assistant output.
- No assistant web browsing, hidden institutional ranking, or eligibility invention.

## Privacy & Public Beta Controls

- Private result feedback.
- Data-minimized ProductEvent analytics.
- User-visible private activity summary.
- JSON account-data export.
- Export exclusion of password hashes, session tokens, OAuth tokens, and application secrets.
- Permanent account and owned Scientific Identity deletion with explicit confirmation.
- Personal relations and provenance cascade on deletion.

## Production Readiness

- Fresh PostgreSQL/pgvector migration validation in CI.
- Prisma generation and migration-status validation.
- ESLint and strict TypeScript.
- Next.js production build.
- Production runtime boot/smoke.
- Better Auth signup/session smoke.
- Anonymous protected-route denial smoke.
- Security headers and nonce CSP.
- Persistent application rate limits.
- Liveness/readiness endpoints.
- Docker release path.
- Non-destructive deployment-smoke workflow.
- Production dependency audit.

## External activation requirements

The repository is release-candidate complete, but a live production launch still requires:

- production PostgreSQL/Neon and backup policy
- safe migration adoption if an existing database predates Prisma migration history
- runtime secrets
- production ORCID credentials and exact HTTPS redirect URI
- optional OpenAI provider configuration
- semantic index generation in the target database
- opportunity ingestion credentials/source operations
- TLS/DNS
- trusted proxy/IP-header configuration
- platform logging/alerting and database monitoring
- successful deployment smoke against the final HTTPS deployment URL

The release candidate should not be described as a completed live production deployment until those external requirements are satisfied.
