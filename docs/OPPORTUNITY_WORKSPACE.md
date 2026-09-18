# Opportunity Workspace v1.1

Opportunity Workspace completes the save-and-track loop without changing scientific relevance or published eligibility.

## SavedOpportunity

A saved opportunity is private to the authenticated User and points to the canonical Opportunity row.

Stored user controls:
- deadlineAlert
- alertLeadDays (1–90)
- optional private notes
- savedAt
- lastAlertedAt reserved for notification delivery workers

The user/opportunity pair is unique. Account or opportunity deletion cascades to the saved record.

## API

GET /api/v1/opportunities/saved lists the authenticated user's saved opportunities and computes how many exact deadlines are currently inside each record's alert window.

POST /api/v1/opportunities/saved creates or updates a saved record.

DELETE /api/v1/opportunities/saved?opportunity=<id> removes the user's saved relationship without deleting the canonical opportunity.

All responses are private/no-store.

## Product semantics

Saving is a workflow action, not a ranking signal.

It does not:
- improve an opportunity's scientific relevance
- change eligibility
- change source freshness
- boost sponsored or popular records
- affect another researcher's results

## Deadline alerts

v1.1 stores the alert policy and exposes the due-soon state in the workspace. lastAlertedAt is intentionally part of the model so a delivery worker can send at-most-once notifications for an alert window.

Actual email/push delivery requires a notification transport and scheduled worker and is not silently claimed by the UI until that transport exists.
