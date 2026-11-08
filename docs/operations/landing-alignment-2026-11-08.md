# Main-site alignment and language placement — 8 November 2026

## Requested corrections

- Remove the inherited 1.1-degree rotation from the Latest opportunities
  container. The inner horizontal ticker animation and its pause controls stay.
- Group the language selector with the main navigation links instead of leaving
  it as an independent centre item in a space-between header.
- Preserve the mobile hamburger, backdrop and menu anchoring. The language
  selector remains above the mobile backdrop and uses logical inline spacing.
- Include the already-merged language-only clarification from PR 50: move
  Chinese, Russian and Hindi before Persian, preserving every other language's
  relative order and all 25 supported choices.

## Validation

- Local targeted lint and TypeScript passed.
- Language-order comparison passed: removing the three moved language codes
  produces exactly the previous sequence.
- PR 50 CI run 264 passed all existing checks.
- Main-site layout CI and post-deployment desktop/mobile checks are pending.

No scanner timing, data records, secrets, paid resources or paused automations
are changed.
