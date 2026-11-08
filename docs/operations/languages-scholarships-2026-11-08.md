# Interface languages and degree scholarships — 8 November 2026

## Scope

Default English remains available without a translation request. A globe and language abbreviation appear in the entrance, marketing and workspace headers, with a fallback selector for other pages. There are 184 ISO 639-1 choices, searchable by native name, English name or code. Selection persists across refreshes; RTL languages set the document direction.

Automatic translation uses the existing server-side Gemini configuration. Only identifiers for predefined public interface messages are accepted. The server resolves these against the checked-in catalog; arbitrary page, profile, document and listing text is never forwarded. Catalog loading is deferred until a non-English language is chosen. Translation batches are cached in Postgres, atomically merged into one row per locale, and share the assistant's existing daily/minute budget. Hashes of the English messages allow unchanged cached translations to survive interface edits, avoiding a full duplicate catalog per release. A visible status distinguishes automatic translation, preparation and unavailable labels. Missing translations retain original English. Translation quality and coverage require language-specific review; this is not a claim of human-reviewed translations.

The entrance has a second row of Master’s and PhD scholarship cards, in that order. Both degree types have URL filters, result/detail routes, organization posting options, workspace navigation, source status and Scanner entries. Original advert fields retain their source text. Unknown application windows are identified; a country-specific deadline is not converted into a universal deadline.

## Sources and actual collection evidence

Two automatic connectors are added to the existing durable ingestion and source lease mechanism:

| Connector | Published data | Intended interval | Local live collection |
| --- | --- | --- | --- |
| `daad-scholarships` | [DAAD scholarship database](https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/), including the data scripts published by that page | 180 minutes | 28 typed programme records: 6 master’s, 22 doctoral; no universal deadline inferred |
| `daad-phdgermany` | [Official PhDGermany RSS](https://api.daad.de/api/feeds/rss/en/phd.xml) | 60 minutes | 28 records: 27 salaried PhD positions and 1 explicit doctoral scholarship; 28 published deadlines |

These are collected records, **not yet evidence of insertion in the live database**. Stable source IDs allow later runs to update rather than duplicate records. Past deadlines use the existing expiry/search exclusion rules. Salaried doctoral posts remain positions. The source publisher is DAAD; no host university or applicant eligibility is invented. A degree target does not imply an applicant's current career stage; the connectors leave that eligibility unspecified when the source does not supply structured rules.

The existing Neon `opportunityscan` trigger was observed enabled at minutes 13 and 43 UTC. Existing source run records were observed on the application branch on 8 November. New connectors still require deployment and a recorded successful scheduled run before continuous live ingestion can be confirmed. A configured cron alone is not proof of uninterrupted 24-hour operation. The pre-existing EU Funding & Tenders connector had a failed run and is not represented as healthy.

Scanner links to Erasmus Mundus, ScholarshipPortal, FindAMasters, FindAPhD, Campus France, grants.at, Commonwealth and Chevening are **external directories**, not automatic import claims. The [Erasmus catalogue](https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en) includes programmes which may not currently offer scholarships; these are not imported as guaranteed funded offers. Sources restricting republication are not copied into the platform.

## Validation and release state

- Eight new focused tests pass: degree separation, safe dataset parsing, country-dependent deadlines, past deadlines, salaried vs scholarship classification, source URL checks, translation allowlisting, and locale/RTL choices.
- TypeScript checking passes against the generated client. Targeted lint passes.
- Full local unit run: 60 tests pass (48 general/source tests and 12 Gemini tests). The initial CI exposed that the general runner was loading the Gemini test directly instead of using its existing isolated fixture runner. The general runner now invokes that dedicated runner; no application guard or authentication code was weakened.
- Migration was applied successfully to isolated Neon preview branch `br-silent-resonance-b985t12g`, parented from the application branch. Read-only checks confirm both enum values and JSON merge semantics. No production migration or test data write was performed in this release step. Automatic review rejected an optional preview sample-row write; that write was abandoned in favour of read-only checks.
- Local full build remains unverified: the worktree lacks its own installed dependencies, reused Next 16.3.6 differs from the pinned 16.4.2, and the existing theme failed in that reused PostCSS build. A fresh dependency install was also blocked by local package-cache permissions. No successful production build is claimed.
- Windows browser control stopped because the tool could not confidently determine the current URL. No further browser actions were taken. Mobile/tablet visual checks, actual non-English provider output, Render deployment, live migration and first scholarship ingestion remain pending.
- The paused account-cohort automation and old monthly teams were not resumed.

Regenerate the public catalog after interface edits with `pnpm --filter @studepartment/web i18n:catalog`. Deploy only after checking the production build, then inspect the new source run timestamps, status and inserted counts on `/sources` and the corresponding degree filters.

Review: https://github.com/busyhfz-dotcom/studepartment/pull/44. [Clean GitHub CI run 254](https://github.com/busyhfz-dotcom/studepartment/actions/runs/42466738813) passed installation, fresh schema migration, lint, types, all unit tests, the actual Next 16.4.2 production build, runtime smoke and the production dependency audit. Runtime checks require the removed availability panel to stay absent and exercise the four entrance cards, both scholarship query types, direct filtered routes, English translation fallback and rejection of arbitrary translation text. This supersedes the local build limitation above; visual/mobile, actual provider output and live ingestion checks remain pending. The final cache reuse and conservative eligibility adjustments also require green CI on their commit before deployment.
