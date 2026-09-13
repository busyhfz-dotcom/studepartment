# API v1 Contracts

The v1 API exists to preserve a stable product boundary while storage, ranking, and AI implementations evolve behind it.

## Response envelope

Successful responses:

```json
{
  "success": true,
  "data": {}
}
```

Errors:

```json
{
  "success": false,
  "error": {
    "code": "SOME_STABLE_CODE",
    "message": "Human-readable explanation"
  }
}
```

## Scientific Identity

### `GET /api/v1/profile`

Returns the current research identity including:

- career context
- institution
- availability
- research interests
- research methods
- collaboration goals
- verification signals

Future write operations must validate visibility and provenance changes separately from ordinary biography edits.

## Researcher Discovery

### `GET /api/v1/discover/researchers`

Returns a deliberately small set of explainable candidates.

Each result includes:

- identity summary
- scientific alignment class
- explanation reasons
- availability
- confidence

The public contract does not expose a competitive researcher score.

## Opportunities

### `GET /api/v1/opportunities`

Each opportunity preserves:

- canonical type
- organization
- location
- deadline
- source URL
- last verification timestamp
- scientific relevance
- formal eligibility assessment
- strengths
- gaps requiring review

Relevance and eligibility are intentionally separate.

## Scientific Introduction Preview

### `GET /api/v1/introductions/preview`

The preview checks the proposed connection before a request is sent.

It contains:

- sender identity context
- recipient availability
- purpose
- relevance class
- explanation reasons
- whether the request is currently allowed
- block reason when not allowed

A later `POST /api/v1/introductions` must repeat server-side policy checks rather than trusting the preview result.

## API principles

1. Explanations are first-class output.
2. Provenance and freshness are first-class for scientific data.
3. Private fields are never implied by public entity endpoints.
4. Paid entitlement must not bypass anti-spam or recipient controls.
5. Recommendation internals may evolve while public semantic classes remain stable.
