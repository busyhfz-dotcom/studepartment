# Opportunity Intelligence v0.6

Opportunity Intelligence separates three questions that should not be collapsed into one opaque score:

1. **Is the opportunity scientifically relevant?**
2. **Does the published source indicate that the researcher is eligible?**
3. **Is the source record current enough to trust operationally?**

## Data model

The canonical `Opportunity` row stores normalized operational fields. Scientific topics and methods use the existing canonical taxonomy through `OpportunityTopic` and `OpportunityMethod`.

Every changed source payload creates a deduplicated `OpportunityProvenance` snapshot keyed by a SHA-256 content fingerprint. Re-observing unchanged source content refreshes observation time without creating duplicate provenance rows.

## Ingestion

Internal ingestion endpoint:

`POST /api/internal/opportunities/ingest`

Authentication:

`Authorization: Bearer <OPPORTUNITY_INGEST_TOKEN>`

A batch identifies the source, whether the batch is a complete source snapshot, and up to 100 normalized records. When `completeSnapshot=true`, active records from that source that are missing from the new snapshot are marked stale instead of being deleted.

The ingestion boundary is source-agnostic. Crawlers, institutional APIs, funder feeds, and manual imports should normalize into this contract rather than writing directly to Prisma.

## Continuous collection

Built-in connectors (`apps/web/src/server/opportunities/sources/`) read official publisher APIs and feeds around the clock:

- The web server starts the collector on boot in production and staging (`instrumentation.ts`). Every 10 minutes it runs the sources that are due; most are due hourly, so a new listing normally appears within an hour of publication. The first check runs about 90 seconds after boot.
- A source that fails is retried after 30 minutes; its existing listings stay up in the meantime. Listings leave search when their deadline passes, when the publisher drops them, or after 45 days without being seen.
- Grants.gov notice texts are cached in memory, so an hourly check reads only new or changed notices in full.
- Backup trigger: `.github/workflows/opportunity-sync.yml` calls `POST /api/internal/jobs/opportunity-sync` every 30 minutes when the repository secrets `PROVENANT_BASE_URL` and `OPPORTUNITY_INGEST_TOKEN` are set. Add `?force=true` to re-read every source.
- `OPPORTUNITY_SYNC=off` disables the in-process collector (for example when only an external scheduler should run it). `GET /api/v1/opportunities/sources` and `/sources` show each source's open listings, new listings today and last check.

## Deadline normalization

The source value is preserved in `deadlineRaw`. The normalized record also carries a precision:

- `EXACT`
- `DATE_ONLY`
- `MONTH_ONLY`
- `ROLLING`
- `UNKNOWN`

Unknown or rolling deadlines are never fabricated into exact timestamps.

## Relevance

Relevance is based on scientific text/topic/method alignment. It does not include formal eligibility.

## Eligibility

Automatic eligibility is deliberately conservative. v0.6 evaluates only structured career-stage and country criteria supplied by the source.

- explicit criteria + all known checks pass → `likely`
- explicit criteria + a known check fails → `unlikely`
- missing criteria or missing researcher profile data → `review`

The engine does not invent eligibility rules from prose.

## Freshness

Freshness is derived from the most recent verified/source observation:

- 0–7 days → `fresh`
- 8–30 days → `aging`
- over 30 days → `stale`

By default, records not observed for 45 days are excluded from discovery unless `includeStale=true`.

## Source honesty

If `DATABASE_URL` is configured and the database has no matching opportunities, the API returns no matches. Demo data is used only when no database connection is configured.
