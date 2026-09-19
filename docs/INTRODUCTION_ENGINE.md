# Scientific Introduction Engine v0.7

Studepartment introductions are controlled scientific requests, not unrestricted direct messages.

## Lifecycle

A request moves through an explicit persisted lifecycle:

- `PENDING`
- `ACCEPTED`
- `DECLINED`
- `WITHDRAWN`
- `EXPIRED`
- `ARCHIVED`

New requests expire after 14 days when they remain pending. State changes write `ConnectionRequestEvent` audit records.

## Ownership and authorization

The authenticated Better Auth session resolves to the canonical `User.id`, then to that user's owned `ResearcherProfile`.

- only the sender can withdraw a pending request
- only the receiver can accept or decline a pending request
- users cannot create introduction requests on behalf of another profile
- self-introductions are blocked

## Recipient policy

Each researcher can configure an `IntroductionPolicy`:

- allow or disable new introduction requests
- require a verified sender identity
- restrict accepted purposes
- set a same-sender cooldown from 1 to 180 days
- set a daily inbound cap from 1 to 50 requests

An empty stored purpose list is interpreted as all purposes for backwards-safe defaults.

## Availability behavior

Availability is enforced before a request is created:

- `OPEN`: policy and anti-spam checks apply
- `SELECTIVE`: purpose must match current collaboration goals and weak scientific overlap is blocked
- `QUIET`: new requests are blocked
- `CLOSED`: new requests are blocked

## Explainable scientific context

The preview and send paths use the same evaluator.

Relevance uses canonical profile topics and methods:

- strong: at least two shared topics, or a shared topic plus a shared method
- relevant: at least one shared topic or method
- weak: no explicit current overlap

The preview returns the actual reasons and any blocking reason. Sending repeats the same policy evaluation to avoid preview/send drift.

## Anti-spam safeguards

v0.7 applies deterministic controls:

- one pending request per sender/receiver pair, reinforced by a PostgreSQL partial unique index
- same-recipient cooldown controlled by the recipient
- maximum 5 new outgoing requests per sender per rolling 24 hours
- maximum 10 pending outgoing requests per sender
- per-recipient inbound daily cap
- exact-context SHA-256 fingerprinting
- the same exact context cannot be reused across multiple recent requests
- context must be 80–1200 characters

Subscription or payment status does not bypass these controls.

## UI surfaces

`/introductions/new?researcher=<id>`

- live recipient/purpose preview
- explainable scientific overlap
- live block state
- context composer
- persistent request creation

`/introductions`

- Inbox and Outbox
- accept / decline / withdraw actions
- status and expiry visibility
- counterpart profile access
- recipient policy controls

## API

- `GET /api/v1/introductions/preview?researcher=<id>&purpose=<purpose>`
- `GET /api/v1/introductions?box=inbox|outbox`
- `POST /api/v1/introductions`
- `PATCH /api/v1/introductions/:id`
- `GET /api/v1/introduction-policy`
- `PATCH /api/v1/introduction-policy`

All endpoints use private/no-store semantics where appropriate and require the authenticated user's owned scientific profile for personalized request operations.

## Known next hardening

The v0.7 application-level daily quotas are rechecked immediately before creation and the active sender/receiver pair is protected by a database partial unique index. A future high-volume deployment can move rolling quota counters to a dedicated transactional/rate-limit store if concurrency requirements demand stricter global serialization.
