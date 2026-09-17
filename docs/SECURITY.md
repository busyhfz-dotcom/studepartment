# Security and Privacy Baseline

This document is an engineering baseline, not a compliance certification.

## Product risks to design against

- scraping or bulk extraction of researcher contact details;
- spam introductions and harassment;
- unauthorized visibility of private profile fields;
- model leakage of private communication content;
- opportunity scams or unverified institutional identities;
- prompt injection from ingested publications or external opportunity text;
- unsafe automated decisions based on opaque AI outputs;
- accidental cross-tenant access in institutional features.

## Controls required before production

### Identity

Use a mature authentication/session system, verified email, optional ORCID linking and step-up verification for sensitive administrative actions.

### Authorization

Implement server-enforced object/action policies. Default private communication and controlled contact data to deny.

### Abuse prevention

Rate-limit discovery export patterns, profile views where appropriate, introduction requests and any future messaging endpoints. Add recipient controls, blocking and abuse reporting.

### Data security

Encrypt traffic in transit, use managed encryption at rest, keep secrets outside source control, rotate credentials, minimize sensitive logs and segregate production data from development/test environments.

### AI and ingestion

Treat external scientific text as untrusted data. Do not allow ingested content to become executable instructions. Keep model tools allow-listed, redact private fields before external model calls where possible, and store provenance for generated explanations.

### Audit

Record sensitive reads/writes and administrative actions with retention controls. Audit logs themselves may contain sensitive metadata and must be access-restricted.

## Current MVP state

The repository includes secure response headers, strict validation at public API boundaries, a domain-level audit model and an AI abstraction that runs without external data transfer. Real authentication, authorization, rate limiting, encrypted private messaging and institutional verification remain explicit pre-production work.
