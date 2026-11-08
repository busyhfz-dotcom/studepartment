# Sharing, grant comparison and reminders — 8 November 2026

## Product changes

- Reusable Share controls on public opportunity lists, details, ticker cards,
  saved listings, institutional postings and opportunity citations. Public
  canonical links support copying, email drafts, WhatsApp, Telegram and native
  device sharing. No notes, documents or private search context are shared.
- Grant tables in the entrance grant route and full filtered explorer use:
  Close date, Status, Title, Agency, Region, Award min, Award max, Actions.
  On small screens rows become labelled cards.
- Export CSV preserves active filters, returns up to 500 public matches, escapes
  CSV quoting and spreadsheet formulas, and includes source and public links.
- Notify me selects one or more current-page opportunities with 15/20-day
  reminders. Existing private saved-opportunity storage records the selected
  lead time. RFC 5545 calendar downloads include a display alarm; users must
  import them and enable calendar notifications.

## Email status and authorization

Readiness reported emailDelivery=false and weeklyDigestJob=false. The existing
signed Neon email trigger is disabled. The owner explicitly chose to prepare
workspace/calendar reminders without configuring an email account or verified
sender domain. UI states that no email delivery is enabled. No email is sent,
and no trigger or paid resource is enabled.

## Data integrity

Grants.gov ingestion now retains official awardFloor, awardCeiling, currency
and agency in existing provenance JSON. EU calls retain programme region and
open/forthcoming status. Scheduled source updates populate new fields; existing
published ceiling descriptions can supply a conservative fallback. Missing
amounts are not invented, and total programme budgets are not treated as awards.
No schema migration or new database resource is required.

Published applicant countries take precedence in Region. Otherwise the funding
programme region is explicitly labelled and users are directed to the call's
eligibility criteria; a US agency is not treated as proof of US-only eligibility.

## External recruitment networks

Automatic LinkedIn/ResearchGate collection is not implemented without permission.
The product offers direct publisher job-board links and clearly distinguishes
them from imported results. Terms checked against primary sources:

- https://www.linkedin.com/legal/user-agreement (sections 8.2.2, 8.2.4, 8.2.13)
- https://www.researchgate.net/terms-of-service (section 4.2, automated access)
- https://simpler.grants.gov/search (comparison layout reference)

## Validation

70 local unit tests passed, including CSV formula/private-note protection,
calendar Unicode folding and date precision, canonical sharing, published
amounts and geographic attribution. Targeted lint passed. CI adds HTTP checks
for grant metadata, filtered CSV, 15/20-day reminder persistence and private-note
exclusion using only disposable local synthetic CI records. Live UI checks and
deployment results follow after release.
