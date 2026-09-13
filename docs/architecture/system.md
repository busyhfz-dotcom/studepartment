# System Architecture

## v0.1.0 direction

Studepartment starts as a modular monolith rather than a microservice fleet.

```text
Web (Next.js)
    |
Application modules
    |
PostgreSQL + Prisma
    |
-----------------------------
| Search | AI | Data Workers |
-----------------------------
    |
Scientific data sources
```

## Core modules

- auth
- scientific identity
- organizations
- publications
- laboratories
- opportunities
- matching
- scientific introductions
- notifications
- trust and verification

## Data principles

PostgreSQL is the initial source of truth. The schema is graph-friendly so a dedicated graph database can be introduced later if query patterns justify it.

Vector search will be added for semantic discovery and matching. Scientific entities retain provenance, confidence, and freshness metadata.

## Scalability principle

Separate services only when operational boundaries become real. Avoid premature service fragmentation.
