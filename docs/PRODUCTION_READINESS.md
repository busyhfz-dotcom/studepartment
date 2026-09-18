# Production Readiness v1.0

Studepartment v1.0 readiness hardens the product foundation for staging and production operation. This document records what is enforced by the repository and what still belongs to the deployment environment.

## Runtime contract

Core runtime variables:

- DEPLOYMENT_ENV: development, test, ci, staging, or production.
- DATABASE_URL: PostgreSQL connection string.
- BETTER_AUTH_SECRET: high-entropy secret, minimum 32 characters.
- BETTER_AUTH_URL: absolute application URL. Production requires HTTPS.
- AUTH_IP_HEADER: trusted reverse-proxy client-IP header. Default: x-forwarded-for.
- AUTH_TRUSTED_PROXIES: optional comma-separated proxy IPs/CIDRs.
- RELEASE_SHA: optional release identifier surfaced by health endpoints.

Optional feature groups remain explicitly degradable:

- ORCID credentials: required together when ORCID is enabled.
- NCBI_EUTILS_EMAIL: required for PubMed enrichment; NCBI_API_KEY is optional.
- OPENAI_API_KEY: semantic retrieval remains structured/lexical without it.
- OPPORTUNITY_INGEST_TOKEN: ingestion remains disabled without it.

Run:

    pnpm env:check

Production configuration fails validation when the base URL is not HTTPS, ORCID is partially configured, PubMed API key lacks a contact email, or ingestion uses a short token.

## Security boundary

### Authentication

Better Auth remains the authentication provider behind the SessionProvider boundary.

Hardening:

- 12–128 character email/password policy.
- 14-day sessions with daily update age.
- trusted origin restricted to BETTER_AUTH_URL origin.
- persistent database-backed Better Auth rate limiting.
- sign-in and sign-up paths receive stricter rules.
- client IP source is configurable for a trusted reverse proxy.

### Application rate limits

The RateLimit table is shared as persistent storage, with application keys namespaced from Better Auth keys.

Protected surfaces include:

- researcher discovery
- institutional discovery
- opportunity intelligence
- scientific graph reads
- publication enrichment synchronization
- scientific introduction creation
- introduction lifecycle actions
- introduction policy edits
- scientific profile updates
- internal opportunity ingestion

Application counters are updated through one atomic PostgreSQL upsert. Raw IP addresses are not stored; client fingerprints are SHA-256 derived with the auth secret.

### Browser security

Global response headers include:

- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy with camera, microphone, geolocation, payment, USB, and browsing topics disabled
- Cross-Origin-Opener-Policy: same-origin
- Cross-Origin-Resource-Policy: same-origin
- Strict-Transport-Security on production builds

HTML routes receive a per-request nonce Content Security Policy through Next.js Proxy.

The CSP denies object/embed and framing, restricts scripts to nonce-authorized scripts, restricts connections to same-origin browser requests, and upgrades insecure requests in production. Dynamic style attributes remain allowed because the current UI uses React style props; scripts never receive unsafe-inline.

Because nonce CSP requires request-time nonce injection, the root layout is force-dynamic. This is an intentional security/performance trade-off for v1.0.

## Health and observability

Public infrastructure endpoints:

- GET /api/health/live
- GET /api/health/ready

Liveness proves the application process is serving requests.

Readiness performs a real PostgreSQL query and returns HTTP 503 when the database is unavailable. It exposes only boolean integration configuration state, deployment environment, release identifier, and latency—never credentials.

The product shell reads the readiness endpoint and displays ready, degraded, or checking state instead of a static status label.

## CI gates

Every pull request and push to main or the canonical development branch validates:

1. Workspace install.
2. Environment contract.
3. Prisma generation.
4. Full migration deployment against fresh PostgreSQL/pgvector.
5. Prisma migration status.
6. ESLint.
7. strict TypeScript typecheck.
8. Next.js production build.
9. Production runtime boot using next start.
10. Liveness and database readiness.
11. Security headers and nonce CSP.
12. Anonymous access denial on /api/v1/me.
13. Real Better Auth email signup.
14. Real session cookie resolution to canonical User.id.
15. Authenticated owned ResearcherProfile resolution.
16. Production dependency audit at high severity threshold.

The runtime smoke uses an ephemeral CI database. No mock session is used.

## Deployment smoke

The Deployment Smoke workflow is manually runnable with any HTTPS staging/production base URL.

It is intentionally non-destructive and verifies:

- liveness
- readiness
- production security headers
- nonce CSP
- anonymous private API denial

Authentication mutation smoke remains in isolated CI to avoid creating accounts in staging or production.

## Container

The root Dockerfile builds with placeholder compile-time configuration and does not bake production secrets into the image.

Runtime secrets must be injected by the deployment platform.

The container includes a liveness HEALTHCHECK.

Database migrations are deliberately not run automatically by application startup. They must be a release/predeploy step so multiple application replicas do not compete to migrate the schema.

## Dependency security overrides

The root pnpm override table temporarily pins:

- deepmerge-ts 8.0.2 to remove GHSA-ggr8-5vv4-36mx from Prisma's transitive config loader path.
- mysql2 3.24.4 to remove the mysql_clear_password downgrade advisory from Better Auth's transitive multi-database dependency tree.

Studepartment uses PostgreSQL, not MySQL, but production audit gates the installed dependency tree rather than relying on database-selection assumptions.

These overrides must be removed when the direct upstream dependency ranges resolve to patched versions. CI migration, build, and runtime-auth smoke tests guard compatibility while the overrides exist.

## Remaining external prerequisites

The repository can enforce application readiness, but the following are deployment-environment responsibilities:

- provision production PostgreSQL/Neon and backups
- apply the documented migration adoption procedure if using the pre-existing Neon schema
- provision TLS and DNS
- register the exact production ORCID redirect URI
- inject runtime secrets
- configure the trusted client-IP header/proxy chain
- run deployment smoke against the live URL
- configure platform logs/alerts and database monitoring

Do not call the deployment production-ready until those external prerequisites and the deployment smoke have been completed.
