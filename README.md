# Studepartment

Studepartment is an AI-powered, privacy-first scientific intelligence and connection platform for medical and biomedical research.

It is designed to help researchers discover the right people, laboratories, institutions, positions, grants, and collaborations without the noise of a conventional social network.

## Current status

`v1.4.0-rc.1 — Public Release Candidate`

The canonical product now includes Scientific Identity, hybrid researcher/lab/institution discovery, opportunity intelligence and saved-deadline workflows, controlled introductions, ORCID/PubMed publication evidence, the Scientific Evidence Graph, Institutional Intelligence, a citation-grounded Research Assistant, private feedback loops, data-minimized product analytics, account export/delete controls, persistent abuse controls, health/readiness endpoints, security headers/CSP, and production runtime smoke validation.

## Core product principles

- Facilitation over engagement.
- Relevance over volume.
- Trust over popularity.
- Explainable AI recommendations.
- Private, permission-based scientific communication.
- Scientific data provenance and freshness.

## Repository structure

```text
apps/
  web/                Next.js product application

packages/
  db/                 Prisma/PostgreSQL scientific data model

docs/
  product/            Vision and roadmap
  architecture/       System architecture
  ai/                 Matching and intelligence design
  security/           Privacy and communication model

.github/workflows/    CI validation
```

## Documentation

- [Product vision](docs/product/vision.md)
- [Product roadmap](docs/product/roadmap.md)
- [System architecture](docs/architecture/system.md)
- [Matching engine](docs/ai/matching.md)
- [Privacy model](docs/security/privacy-model.md)
- [Production readiness](docs/PRODUCTION_READINESS.md)
- [Deployment runbook](docs/DEPLOYMENT_RUNBOOK.md)
- [Research Assistant](docs/RESEARCH_ASSISTANT.md)
- [Public Beta controls](docs/PUBLIC_BETA_CONTROLS.md)

## Release candidate scope

v1.4.0-rc.1 contains the complete repository-side product loop:

1. Verified and provenance-aware Scientific Identity.
2. Explainable hybrid discovery across researchers, laboratories, and institutions.
3. Source-aware Opportunity Intelligence with separate relevance and eligibility.
4. Private saved-opportunity workflow and deadline alert policy.
5. Controlled scientific introductions with recipient policy and anti-spam controls.
6. ORCID/PubMed publication enrichment and Scientific Evidence Graph.
7. Institutional Intelligence and deterministic scientific-fit evidence.
8. Citation-grounded Research Assistant constrained to canonical Studepartment evidence.
9. Private feedback, data-minimized product analytics, account export, and permanent account deletion.
10. Production-readiness CI, security headers/CSP, health endpoints, Docker release path, and deployment smoke tooling.

Live production launch still depends on deployment infrastructure and credentials documented in the Deployment Runbook.

## Development

Requirements:

- Node.js 22+
- pnpm 10+
- PostgreSQL

Install and run:

```bash
pnpm install
pnpm dev
```

Validation:

```bash
pnpm env:check
pnpm lint
pnpm typecheck
pnpm build
```

Production-like runtime validation is enforced in CI after `next start`; see [Production Readiness](docs/PRODUCTION_READINESS.md) and the [Deployment Runbook](docs/DEPLOYMENT_RUNBOOK.md).

Database commands:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:migrate:status
```

## Product boundary

Studepartment does not optimize for followers, likes, public researcher rankings, or endless feed engagement. The primary outcome is a meaningful scientific discovery or connection.
