# Privacy and Communication Model

## Objective

Provide private, permission-based scientific communication while protecting researchers from spam, surveillance-style engagement mechanics, and unnecessary exposure.

## Data classes

### Public scientific data
- Name
- Publications
- Research topics
- Public institutional affiliation

### Controlled data
- Contact preferences
- Availability
- Selected professional details

### Private data
- Messages
- Drafts
- Notes
- Private goals and preferences

## Core rules

1. Private messages are not publicly indexed.
2. Private communication is not used for advertising targeting.
3. Authorization is checked server-side for every protected resource.
4. Recipients control who may request introductions.
5. Abuse controls include rate limiting, block, report, and spam detection.
6. AI access to private conversations is context-bound and should require an explicit product action.

## MVP security baseline

- TLS in transit
- Encryption at rest via managed infrastructure
- Secure session cookies
- CSRF/XSS protections
- Rate limiting
- Secrets management
- Audit events for sensitive actions
- Account deletion and data export paths

## Future private messaging

End-to-end encryption should be evaluated as a dedicated architecture project before making any marketing claim that implies messages are technically unreadable by the service.
