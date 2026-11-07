# Gemini Research Assistant — 7 November 2026

Base release: `b5c69c1584d5b357fa49e0dec32f417cc0828e28` on `codex/provenant-render-migration`.

## Implemented

- Native server-side Gemini generateContent adapter; no additional production dependency or browser-side key.
- Configurable stable `gemini-3.1-flash-lite` default, verified against Google's current model catalog and pricing documentation on this date. This model has a documented free tier, subject to the actual project's quota and region availability.
- Gemini key in Render's private `GEMINI_API_KEY` environment variable. No key was supplied or read during implementation.
- Consent unchecked by default and enforced by the API before any external call. Private identity, private authorship associations, private researcher targets, uploads, source URLs and internal target identifiers excluded from provider input. Profile-based matching still occurs locally.
- Public-source citation validation, shared database-backed request caps, per-user caps, timeout and bounded output. No automatic provider retries, browsing tools or paid provider fallback.
- Provider failures, exhausted limits and ungrounded output fall back to explicitly labelled structured evidence review.

## Validation

- `node apps/web/scripts/test-gemini-assistant.mjs`: 12/12 passed. Actual adapter and answer orchestration tested with synthetic sources, mocked transport and isolated retrieval/counter fixtures; no live Gemini request or real account used.
- TypeScript passed using the existing workspace's installed dependencies and generated database client. The isolated worktree uses a temporary typecheck configuration to resolve the existing workspace database package.
- Live health endpoint returned HTTP 200 with the base release SHA before this change. This does not verify Gemini activation.

## Publication and activation

GitHub CLI reports its account token is invalid. Git push could not invoke the credential helper in the current execution environment (`NtCreateDirectoryObject ... 0xC0000022`), so no remote Gemini publication has been confirmed. Browser publication will be attempted if the connected session permits it.

Render still needs a private Gemini API key, publication of this commit and deployment. A real inference test with only a synthetic question and public source ledger remains pending. Do not report Gemini as active before that succeeds.

Official references:
- https://ai.google.dev/gemini-api/docs/models
- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/api/generate-content
- https://ai.google.dev/gemini-api/docs/api-key

Follow-up: activate with the user's private Render configuration, deploy the reviewed commit and verify the signed-in assistant flow on desktop/mobile plus the source links.
