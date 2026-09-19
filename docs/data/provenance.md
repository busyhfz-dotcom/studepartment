# Scientific Data Provenance

Every externally sourced scientific fact must remain traceable to its origin.

## Minimum provenance record

For each imported entity or material field, retain enough metadata to answer:

- Which source supplied this information?
- What external identifier did that source use?
- When was it first observed?
- When was it last fetched or verified?
- Which source URL or API resource supports it?
- How confident is the entity-resolution decision?
- Has the user subsequently corrected or overridden the imported value?

## Initial sources

- ORCID — scientific identity, affiliations, works metadata and external identifiers within the visibility/permission available to the integration.
- PubMed — biomedical publication metadata and abstracts where provided by NCBI services.
- OpenAlex — scholarly entities and graph relationships.
- Crossref — DOI and publication metadata.
- Official university, hospital and funder sources — organization and opportunity verification where use is permitted.

ORCID is not treated as a full-text repository. It primarily describes links between researchers and research activities; publication details can be enriched using identifiers from the appropriate source. This keeps source responsibilities explicit.

## Visibility boundary

Imported data must preserve the difference between:

1. public source data,
2. data explicitly released to Studepartment through user authorization,
3. user-controlled private data.

A field becoming available to the application does not automatically make it public on a Studepartment profile.

## Canonical entity versus source record

The canonical entity is the product-facing researcher, institution, publication, lab or opportunity.

Source records are evidence about that canonical entity. Multiple source records may resolve to one canonical entity.

```text
ORCID record ─────┐
PubMed author ────┼──> Canonical Researcher
University page ──┘
```

Entity resolution should never destroy source-specific identifiers or evidence.

## Confidence

Confidence is an internal data-quality signal, not a public researcher reputation score.

Possible signals include:

- authenticated ORCID ownership,
- stable external identifier match,
- affiliation overlap,
- publication overlap,
- institution-domain verification,
- name similarity,
- recency and consistency across independent sources.

Low-confidence merges should remain reviewable rather than being silently treated as fact.
