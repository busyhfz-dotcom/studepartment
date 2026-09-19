# Scientific Identity v1

## Status

Foundation database migration has been applied to the Development Neon database. Scientific Identity is the next implementation boundary after persistence foundation.

## Identity Boundary

The application identity flow is:

User session
→ User.id
→ ResearcherProfile.userId
→ authorized profile operations

Client supplied researcher identifiers must not be trusted for write operations.

## Profile Capabilities

Version 1 profile capabilities:

- public researcher profile
- affiliation management
- research topics
- research methods
- collaboration goals
- availability mode
- ORCID identifier storage
- verification state
- profile completeness guidance

## Completeness Guidance

Completeness is a guidance mechanism, not a reputation score.

Suggested dimensions:

- Identity
- Affiliation
- Research Topics
- Research Methods
- Collaboration Intent
- Publications
- Scientific Verification

## Provenance Rule

External scientific records are not canonical entities.

Canonical model:

ResearcherProfile

linked to:

- ORCID records
- publication sources
- institutional records

through provenance records.

## Next Engineering Steps

1. Add authenticated session boundary.
2. Replace fixture writes with Prisma-backed repositories.
3. Add provenance entities.
4. Implement ORCID import after identity boundary is stable.
5. Extend discovery and matching on verified data.
