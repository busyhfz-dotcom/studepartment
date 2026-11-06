# Deployment Runbook

This runbook is the release path for Provenant after Production Readiness v1.0.

## 1. Build once

The application is built as a Node.js Next.js service.

Container:

    docker build -t provenant:<release-sha> .

The image build uses non-secret placeholder configuration only. Never pass production credentials as Docker build arguments.

## 2. Provision runtime configuration

Required:

    DEPLOYMENT_ENV=production
    DATABASE_URL=postgresql://...
    BETTER_AUTH_SECRET=<high-entropy-secret>
    BETTER_AUTH_URL=https://<production-host>
    AUTH_IP_HEADER=<header-overwritten-by-trusted-proxy>
    RELEASE_SHA=<git-sha>

Optional integrations:

    AUTH_TRUSTED_PROXIES=
    NCBI_EUTILS_EMAIL=
    NCBI_API_KEY=
    OPENAI_API_KEY=
    OPENAI_EMBEDDING_MODEL=text-embedding-3-small
    OPENAI_ASSISTANT_MODEL=gpt-5.6-luna
    OPPORTUNITY_INGEST_TOKEN=

Before deployment:

    pnpm env:check

## 3. Database release step

Take or verify a recent backup before schema changes.

For a fresh database:

    pnpm db:generate
    pnpm db:migrate:deploy
    pnpm db:migrate:status

### Existing Neon database created before migration history

The original live Neon database had schema objects before Prisma migration history was introduced.

Do not blindly execute the foundation baseline SQL against that database.

Procedure:

1. Back up the database.
2. Confirm the existing schema matches the foundation baseline.
3. Mark only the baseline migration as already applied:

       pnpm --filter @studepartment/db exec prisma migrate resolve --applied 20260912000000_foundation_baseline

4. Deploy all later migrations:

       pnpm db:migrate:deploy

5. Confirm:

       pnpm db:migrate:status

Never use prisma db push for production.

## 4. Deploy application replicas

Start:

    pnpm --filter @studepartment/web start

The platform should use:

- liveness: /api/health/live
- readiness: /api/health/ready

Only route traffic to replicas whose readiness check returns HTTP 200.

## 5. Post-deploy verification

Run the GitHub Actions workflow named Deployment Smoke with the exact HTTPS deployment URL.

Also manually verify the critical authenticated flow in staging before the first production launch:

1. Sign up with a test account.
2. Confirm session persistence after navigation/reload.
3. Open Scientific Identity.
4. Complete profile onboarding.
5. Save an ORCID link in a test profile and open the public record.
6. Run publication sync if PubMed is configured.
7. Search researchers, labs, institutions, and opportunities.
8. Open a canonical researcher profile and Evidence Graph.
9. Send a controlled Introduction to a test recipient.
10. Accept/decline/withdraw using the intended actor account.

## 6. ORCID profile links

Researchers can save an optional ORCID iD or record URL in their profile links. Provenant validates the format and links to the public record. This requires no ORCID credentials or OAuth setup.

## 7. PubMed

Set NCBI_EUTILS_EMAIL to an operational contact address.

NCBI_API_KEY is optional.

Existing publication evidence retains its recorded sources.

## 8. Semantic retrieval

If OPENAI_API_KEY is absent, discovery reports and uses structured-lexical retrieval.

If enabled, ensure the semantic index has been generated using the intended embedding model before relying on hybrid results.

The product must never claim hybrid/vector retrieval when the semantic provider/index is unavailable.

## 9. Research Assistant

If OPENAI_API_KEY is absent, the Research Assistant returns an explicit not-configured response. It does not fall back to ungrounded model output.

OPENAI_ASSISTANT_MODEL controls the synthesis model. The repository default is gpt-5.6-luna.

The assistant sends only the authenticated user's request-specific Provenant source ledger and question to the provider, requests store=false, and does not enable external web browsing.

Verify in staging that:

- anonymous assistant requests return 401
- authenticated users without a Scientific Identity receive an explicit identity-required response
- generated answers show valid Provenant source ids
- provider failures do not produce fabricated fallback answers

## 10. Opportunity ingestion

OPPORTUNITY_INGEST_TOKEN should be a high-entropy secret of at least 32 characters.

The endpoint is:

    POST /api/internal/opportunities/ingest

It uses Bearer authentication, timing-safe token comparison, payload validation, provenance, freshness handling, and persistent rate limiting.

Do not expose the ingestion token to browser code.

## 11. Rollback

Application rollback:

- deploy the previous immutable image/release SHA
- verify /api/health/live and /api/health/ready
- run Deployment Smoke

Database rollback:

Prisma migrations are forward migrations. Do not automatically reverse a production migration.

For a faulty schema release:

1. stop further deploys/writes if required
2. restore from the verified backup or create a forward corrective migration
3. confirm migration status
4. redeploy the compatible application image

## 12. Secret rotation

BETTER_AUTH_SECRET rotation can invalidate existing protected material if changed abruptly.

Plan auth secret rotation using the authentication provider's supported rotation mechanism rather than replacing the secret ad hoc.

Rotate immediately if any of these are exposed:

- BETTER_AUTH_SECRET
- DATABASE_URL credentials
- OPENAI_API_KEY
- OPPORTUNITY_INGEST_TOKEN
- NCBI_API_KEY

After rotation, run readiness and deployment smoke.

## 13. Go-live gate

Production go-live requires all of the following:

- canonical branch CI green
- production database backup confirmed
- migrations applied and status clean
- HTTPS base URL configured
- runtime env validation passed
- readiness HTTP 200
- deployment smoke green
- Better Auth signup/session smoke passed in CI
- Optional ORCID profile link saves and opens the public record
- logs and database monitoring visible to operators

A successful build alone is not a go-live signal.

## 14. Recovery email and research reminders

1. Verify the sender domain in Resend and create a sending-only API key scoped to that domain.
2. Set `RESEND_API_KEY` and `DIGEST_FROM_EMAIL` in the private Render service environment. Keep `EMAIL_DIGEST_ENABLED=false` while testing password recovery and verification with a controlled account.
3. Confirm that a recovery link reaches the test mailbox, opens the current site, works once, and revokes the old sessions after the reset. Confirm account email verification separately.
4. Set `EMAIL_DIGEST_ENABLED=true` and enable the Neon schedule named `email-digest` on the same branch as the opportunity scanner. It calls `/digest` on the signed scheduler daily. Configure only one digest scheduler. A bearer-token scheduler can instead use `DIGEST_JOB_TOKEN` and `POST /api/internal/jobs/weekly-digest`.
5. Verify that only a verified account with research emails enabled receives its deadline reminder and that a second run does not send the same reminder again. The daily job attempts at most 60 emails, leaving capacity for recovery and verification.

## 15. Pro payment activation

The four planned prices in `apps/web/src/lib/plans.ts` are USD 8 monthly, USD 15 every three months, USD 45 every six months, and USD 90 annually. The plan details page is available while the workspace remains in Pro preview.

Once the payment provider and merchant account are selected, configure the four recurring prices and their intervals in the provider's test environment. Create checkout sessions on the server for signed-in accounts. Use the provider's signed webhook to apply entitlements only after confirmed payment, validate the account and plan mapping, and handle retry, cancellation, expiration, and renewal. Keep live credentials private. Enable billing enforcement only after sandbox checkout and webhook tests pass and the owner approves activation.
