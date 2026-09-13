# Studepartment

Studepartment is an AI-powered, privacy-first scientific intelligence and connection platform for medical and biomedical research.

It is designed to help researchers discover the right people, laboratories, institutions, positions, grants, and collaborations without the noise of a conventional social network.

## Current status

`v0.1.0 — Foundation`

The repository currently contains the initial product documentation, web application shell, scientific identity UI, database schema, and CI foundation.

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

## v0.1.0 scope

The first foundation release establishes:

1. The monorepo and CI baseline.
2. Scientific identity data structures.
3. Researcher, institution, lab, publication, opportunity, and connection entities.
4. The initial product visual language.
5. Documentation for matching, privacy, and roadmap decisions.

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
pnpm lint
pnpm typecheck
pnpm build
```

Database commands:

```bash
pnpm db:generate
pnpm db:migrate
```

## Product boundary

Studepartment does not optimize for followers, likes, public researcher rankings, or endless feed engagement. The primary outcome is a meaningful scientific discovery or connection.
