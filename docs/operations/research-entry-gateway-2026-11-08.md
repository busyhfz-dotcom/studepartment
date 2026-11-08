# Research entry gateway — 8 November 2026

## Scope

Replace the four entrance choices with two generous, audience-led invitations:
Find grant & position, and Post a position. Remove the numbered progression.
Use lightweight original SVG illustrations, professional copy, responsive layouts,
and reviewed Persian and Spanish entrance labels. Preserve 25 languages and the
self-hosted Persian font.

The research route offers Master's scholarships, PhD scholarships (with a
separate MD-PhD link), grants for group leaders/PIs, and research positions.
Institutional posting leads to the existing institution sign-up and organization
profile publishing workflow. No accounts or public synthetic records are created.

## Classification and source evidence

The new `audience=md-phd` filter requires an explicit dual-degree title or an NIH
F30 fellowship from Grants.gov. Generic PhD, F31, institutional T32 grant,
closed and expired records are not reclassified as individual MD-PhD awards.
The filter composes with country, text, funding institution and pagination;
the full opportunity explorer and navigation also expose this route.

Live read-only checks before release found 6 Master's programmes, 23 PhD
scholarship/programme records and two F30 notices. These are observations, not
promises of coverage or applicant eligibility. DAAD imports already use the
existing scheduler. Erasmus Mundus is linked as an official directory: not every
listed programme has a current scholarship. T32 is an institutional route.

- F30: https://www.cancer.gov/grants-training/training/funding/f30
- T32: https://grants.nih.gov/funding/activity-codes/T32
- Erasmus: https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en

## Verification

- Local: 51 general unit/regression tests and 12 isolated Gemini tests passed.
- Local TypeScript and targeted lint passed.
- Runtime smoke covers two entrance headings, direct category/posting routes,
  original-source scholarship routes, MD-PhD API and translation allowlisting.
- New CI-only integration creates eight disposable synthetic opportunity
  fixtures in local CI PostgreSQL, checks audience classification, expiry,
  country/text filtering and pagination through the HTTP API, and cleans up.
- Full CI run 259 passed: fresh migrations, lint, TypeScript, 63 unit tests,
  production build, HTTP runtime smoke including eight audience fixtures, and
  production dependency audit.
  https://github.com/busyhfz-dotcom/studepartment/actions/runs/42498302761
- PR 47 merged to the deployment branch at
  `d93ba0d085ca58062478a54cbbc783d1173d0e3d`.
  https://github.com/busyhfz-dotcom/studepartment/pull/47
- Render deployment `dep-dbo9ub15efls73d93dsg` was triggered for that exact
  release in the confirmed Hfz's workspace and became live at 16:14:53 UTC.
- Public health reports the exact release and database ready. The production
  MD-PhD API returns two current F30 notices, both with Grants.gov links.
- Browser checks at 717 × 738 and 400 × 712 confirmed two entrance links and no
  horizontal overflow. Persian RTL and Nazanin rendered; its longer text pushed
  the second card below the 712px mobile viewport, prompting a follow-up copy and
  spacing adjustment. Final mobile verification follows that release.

No Railway resources, paid plans, existing scanner timing, secrets or user
records are changed. Previously paused account-revisit automations stay paused.
