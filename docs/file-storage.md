# Files and document storage

Production documents are stored in the private Railway bucket studepartment-files in the same project as the application and Postgres. The web service uses Railway reference variables for ENDPOINT, BUCKET, REGION, ACCESS_KEY_ID and SECRET_ACCESS_KEY; credentials never reach the browser. Profile photos remain normalized WebP bytes in Railway Postgres, preserving existing photo URLs across deploys.

## Product surfaces

- /files: shared file library, categories, search, storage usage, download, rename, delete, visibility and revoke introduction sharing.
- Personal profile and onboarding: CV, education, training, certificates, manuscripts, projects, awards and grant documents. Supporting profile fields accept uploaded documents or external links.
- Organization profile and onboarding: organizational documents, accreditations, facilities, programs and related evidence.
- Saved opportunities: separate private documents for each saved application.
- Introductions: up to five explicitly selected library documents; receiver access lasts while the introduction is pending (and unexpired) or accepted. Withdrawal, decline, expiry, file removal or “Revoke shared access” removes recipient access.
- Public profiles display only documents the owner explicitly publishes. Setting a personal profile private also blocks its public document downloads.

## Upload and access rules

- Authentication, same-origin mutation checks, per-user limits and server-side file validation.
- 20 MB per file, 100 files / 250 MB per account, included free. Storage reservations are serialized per owner in Postgres so concurrent uploads cannot bypass the quota.
- PDF; modern Office DOCX, XLSX and PPTX without macros; UTF-8 TXT/CSV; JPG, PNG, WebP and supported phone image formats. Images are rotated, resized to at most 2400 pixels and re-encoded without original metadata.
- Old binary Office formats, arbitrary ZIP archives, executables, scripts and SVG are rejected. Type validation is not an antivirus scan. Downloads use attachment disposition, nosniff, sandbox and no-store headers.
- Private files use authenticated server downloads, not public bucket links. Public access is opt-in, available for profile/organization files, and checked on every download. HTTP byte ranges support resuming downloads.
- Upload status and metadata live in Postgres; an interrupted upload cannot appear as a completed file.

## Deletion and recovery

Deleting a file removes its record and access immediately. A durable Postgres deletion queue retains the object key until Railway confirms deletion. Account removal queues all document objects in the same transaction as deleting the user; existing profile photos cascade with the account.

The Node server starts a lightweight cleanup loop at startup and every five minutes. File activity also triggers cleanup after the response. Jobs wait two minutes to allow uploads in flight to settle; incomplete uploads older than one hour are removed. If the bucket is temporarily unavailable, jobs remain for the next attempt. No local disk storage is required.

Existing files are not downloaded during ordinary page rendering. File lists contain metadata only; application document panels load on expansion. Storage SDKs and image processing stay on the server.

## Verification

Run the validation suite using the repository's tsx runtime:

    tsx --tsconfig apps/web/tsconfig.json --test apps/web/tests/file-validation.test.ts

Production smoke verification should cover signed-in upload/download, anonymous and second-account denial, explicit public access/revocation, profile visibility, scoped application ownership, unsupported files, byte ranges, delete, account removal and persistence through redeployment. Use temporary accounts and remove them afterward.
