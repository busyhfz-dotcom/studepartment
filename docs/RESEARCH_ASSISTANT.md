# Grounded Research Assistant v1.3

The Studepartment Research Assistant is a synthesis layer over canonical product evidence. It is not an unrestricted chatbot and it does not browse the public web.

## Request boundary

POST /api/v1/assistant/research

The endpoint requires an authenticated user with an owned Scientific Identity.

Questions are limited to 1200 characters. Requests are protected by persistent client and user rate limits.

## Context construction

Each request receives a fresh source ledger built from canonical PostgreSQL data.

The ledger can include:

- the authenticated user's Scientific Identity
- recent active publication evidence
- public researchers with exact canonical topic/method overlap
- institutions represented by overlapping public current researchers
- current source-backed opportunities with exact canonical topic/method overlap
- an explicit institution, researcher, or opportunity target when supplied

The model receives only that ledger plus the user question.

No external web-search tool is enabled for the assistant.

## Provider behavior

The provider uses the OpenAI Responses API when OPENAI_API_KEY is configured.

The model is controlled by OPENAI_ASSISTANT_MODEL and defaults to gpt-5.6-luna.

Requests set store=false.

If the provider is unavailable, times out, or is not configured, the endpoint returns an explicit error instead of fabricating an answer.

## Citation enforcement

The source ledger assigns request-local identifiers such as S1 and S2.

The assistant is instructed to cite factual claims with those identifiers. The server validates that at least one returned citation points to an identifier that actually exists in the request ledger.

Only referenced ledger entries are returned to the UI.

## Guardrails

The assistant must not:

- infer facts outside the ledger
- turn publication counts into researcher quality
- turn institutional size or graph connectivity into prestige
- turn scientific relevance into formal eligibility
- predict hiring/admission probability
- provide patient-specific diagnosis or treatment advice

If evidence is missing, the expected answer is that Studepartment does not have enough evidence.

## Institutional fit

Institution pages expose a deterministic fit snapshot separately from AI synthesis.

It compares the authenticated Scientific Identity with public current researcher evidence at that institution and reports:

- shared canonical topics
- shared canonical methods
- current institution opportunities overlapping the user's canonical topics/methods
- explicit evidence gaps

There is no opaque institutional-fit score and no institutional ranking.

## Privacy

The UI discloses the provider boundary before generation.

When configured, the user's question and request-specific canonical context are sent to the AI provider for generation. No hidden conversation history is sent by v1.3.
