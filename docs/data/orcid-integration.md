# ORCID Integration Contract

ORCID is treated as a scientific identity source, not as the complete user profile.

## Goals

- reduce manual onboarding effort
- strengthen identity confidence
- import public scientific works and affiliations where available
- preserve source provenance
- let the user review imported data before it influences matching

## Import flow

1. User chooses **Connect ORCID**.
2. OAuth authorization returns an ORCID identifier and access context.
3. Studepartment fetches permitted public/authorized profile data.
4. Imported entities enter a staging state.
5. Entity resolution compares imported organizations and publications with canonical Studepartment entities.
6. User reviews material conflicts.
7. Accepted records are linked to the Scientific Identity.

## Provenance

Every imported field that may affect trust or matching must retain:

- source (`ORCID`)
- source identifier
- retrieved timestamp
- last verified timestamp when applicable
- whether the value was user-edited after import

## Matching boundary

Imported ORCID data must not automatically override explicit user intent. For example, publication history may indicate oncology expertise while the user currently states that they are seeking a transition into medical imaging. Both historical evidence and current intent should remain distinct signals.

## Privacy boundary

- Request the minimum scopes necessary.
- Do not expose email or private ORCID fields by default.
- Disconnecting ORCID stops future synchronization but should not silently erase canonical public publication entities shared by the wider graph.
- User-owned profile associations and imported private metadata must remain removable.

## MVP

The v0.2 implementation may begin with the authorization contract and import staging model before live synchronization is enabled.
