# Public Beta Controls v1.4

Studepartment Public Beta controls complete the private feedback, product-analytics, data portability, and account-deletion surfaces required before a public release candidate.

## Private feedback

Authenticated users can attach one current feedback signal to a discovered researcher, laboratory, institution, or opportunity.

Supported signals include:

- relevant
- not relevant
- already know
- wrong career stage
- wrong field
- not available

Feedback is private to the user.

Negative feedback suppresses that entity from later results for the same authenticated user. It does not change the scientific score, public ranking, source confidence, or another user's results.

Relevant feedback is recorded for product learning but is not used as a public or scientific boost in v1.4.

## Product events

ProductEvent records a deliberately small event vocabulary:

- profile updated
- feedback submitted
- opportunity saved
- introduction sent
- Research Assistant used
- data exported

The event table stores the authenticated user, event type, timestamp, and an optional entity reference.

It does not store:

- raw discovery queries
- Research Assistant question text
- introduction context
- saved-opportunity notes
- publication abstracts
- message content

Product events are private operational analytics and cascade when the user account is deleted.

## Activity summary

GET /api/v1/account/activity returns the authenticated user's own product-event counts and current feedback count.

The Privacy & Data page displays this summary so analytics are inspectable rather than invisible.

## Data export

GET /api/v1/account/export produces a JSON attachment containing the authenticated user's account data and scientific relationships, including:

- account metadata
- non-secret session metadata
- provider account metadata
- Scientific Identity
- affiliations
- topics and methods
- publication relationships and evidence
- lab memberships
- introduction policy and requests
- saved opportunities
- private feedback
- product events

The export explicitly excludes:

- password hashes
- session tokens
- OAuth access tokens
- OAuth refresh tokens
- OAuth ID tokens
- application secrets

Shared bibliographic publication records are represented through the user's relationship; exporting them does not make them private user-owned records.

## Account deletion

DELETE /api/v1/account requires the exact confirmation phrase:

DELETE MY ACCOUNT

The service deletes the owned ResearcherProfile before deleting the canonical User row so a public orphaned identity is not left behind.

Cascading relations remove sessions, provider accounts, saved opportunities, feedback, product events, introductions, owned evidence, and personal scientific relationships.

Shared non-personal bibliographic Publication rows may remain after personal authorship/provenance relationships are removed.

## Security

- feedback writes are rate limited
- data exports are rate limited
- account deletion is rate limited
- all account/privacy responses are private/no-store
- runtime and deployment smoke assert anonymous denial for feedback and account export
- account deletion is never exercised by deployment smoke

## Product boundary

Feedback is a private preference signal, not a reputation system.

Product events are data-minimized operational telemetry, not behavioral advertising data.

Data export and deletion are user-control surfaces and do not depend on subscription tier.
