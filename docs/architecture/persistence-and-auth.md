# Persistence and Authentication Boundaries

## Purpose

Studepartment separates account identity from scientific identity. Authentication answers **who is signed in**; the scientific profile answers **who this person is in the research graph**.

## Persistence

PostgreSQL is the source of truth for v0.x. Prisma provides the application data layer.

Runtime rules:

1. Database clients are initialized lazily.
2. Builds and static analysis must not require production secrets.
3. API contracts remain independent from the ORM implementation.
4. Repository boundaries map database entities into product-facing types.
5. Fixture repositories remain available only for local development and tests when no `DATABASE_URL` exists.

## Environment model

- Local / CI without a database: fixture repository.
- Development with `DATABASE_URL`: Prisma-backed repository.
- Staging / production: Prisma-backed repository only.

The application must fail explicitly at runtime if a database-backed operation is attempted without a configured `DATABASE_URL`.

## Authentication boundary

The `User` entity is intentionally separate from `ResearcherProfile`.

A user account contains authentication and authorization concerns:

- stable user id
- email / sign-in identity
- account role
- session state
- security controls

A researcher profile contains scientific concerns:

- public scientific identity
- affiliations
- research topics and methods
- publications
- collaboration preferences
- availability
- verification state

This prevents login-provider details from leaking into the public scientific graph.

## ORCID

ORCID is treated primarily as a scientific verification and import channel, not as the sole account system.

Planned flow:

1. User signs in to Studepartment.
2. User explicitly connects ORCID.
3. ORCID identity is verified through an authorized OAuth flow.
4. Permitted scientific data is imported with provenance.
5. Imported information is reviewed before it changes user-controlled profile fields where appropriate.

## Authorization

Application authorization should be resource-based rather than UI-based.

Examples:

- only a profile owner or authorized institutional admin can edit controlled fields;
- private introduction requests are visible only to participants and permitted moderators;
- public scientific data and controlled contact data are fetched through different permission paths;
- administrative access is auditable.

## Authentication implementation decision

The account/session provider must be selected on stability, maintainability, passkey/OAuth support, and compatibility with Next.js 16. ORCID integration remains separate from this decision.

Until that decision is finalized, route handlers must not assume a specific authentication library. Application code should depend on a small session interface such as:

```ts
export type CurrentUser = {
  id: string;
  role: string;
};
```

Repository methods then receive a stable user id instead of importing authentication-library internals.
