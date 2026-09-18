# Publication Enrichment v0.8

Publication enrichment strengthens Scientific Identity with source-backed research outputs without turning publications or citations into popularity metrics.

## Evidence model

Studepartment keeps three evidence levels separate:

- MANUAL_ASSERTED
- ORCID_ASSERTED
- PUBMED_CORROBORATED

A verified ORCID iD proves ownership of the ORCID record. It does not automatically make every work on that record bibliographically verified.

ORCID works therefore enter as ORCID_ASSERTED. When a PMID or DOI from that work matches a PubMed record, the researcher-publication relationship becomes PUBMED_CORROBORATED.

## ORCID source

The sync requires a verified ORCID provenance record on the authenticated user's owned ResearcherProfile.

The server obtains a /read-public token using the configured ORCID client credentials and reads the public API v3.0 /works endpoint.

At most 100 public ORCID work groups are processed in one user-triggered sync.

No personal ORCID OAuth access token is stored by this implementation.

## PubMed source

PubMed enrichment uses NCBI E-utilities.

Configuration:

- NCBI_EUTILS_EMAIL is required for PubMed enrichment.
- NCBI_API_KEY is optional.

The implementation includes tool=studepartment and the configured contact email on E-utilities requests.

ORCID PMIDs are fetched directly. ORCID works that only have a DOI are searched through PubMed's Article Identifier field, then resolved through ESummary.

If PubMed is unavailable or not configured, ORCID synchronization still completes and returns an explicit warning. Existing PubMed-corroborated metadata is not downgraded by an ORCID-only refresh.

## Canonical identity and deduplication

Publication canonical keys use this precedence:

1. PMID
2. normalized DOI
3. ORCID iD + ORCID work put-code

PMID and DOI are also unique database fields.

The ORCID fallback includes the ORCID iD because put-codes are record-scoped rather than globally unique.

## Provenance

PublicationProvenance stores source snapshots with:

- source type
- source record id
- source URL
- SHA-256 content fingerprint
- assertion / verification status
- observed and verified timestamps
- source metadata

Changed source content produces a new provenance fingerprint. Re-observing unchanged content refreshes observation time.

## Freshness and stale relationships

ResearcherPublication has an active flag and lastObservedAt timestamp.

When a full ORCID works sync no longer sees a previously imported ORCID relationship:

- the relationship is retained for auditability
- active becomes false
- corresponding ORCID provenance is marked STALE
- the inactive relationship is no longer returned in the active publication list

No publication record is hard-deleted during synchronization.

## Trust signal

The Scientific Identity "Publications" trust signal is true only when at least one active researcher-publication relationship is PUBMED_CORROBORATED.

ORCID-only works remain visible as source-backed assertions but do not satisfy that verified publication signal.

## API

GET /api/v1/profile/publications

Returns active publication evidence for the authenticated researcher's owned profile.

POST /api/v1/profile/publications/sync

Runs the verified ORCID -> PubMed enrichment pipeline.

Both endpoints are private/no-store.

## Deliberate limitations

- citationCount is not populated from PubMed and remains outside the ranking model
- abstract ingestion is not included in v0.8 because the JSON ESummary path is used for conservative metadata enrichment
- public researcher profile pages are still a separate retrieval surface and will be wired to canonical publication data in the graph/profile stage
- automatic background refresh is not enabled yet; v0.8 is explicit user-triggered synchronization
