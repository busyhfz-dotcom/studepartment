# Matching Engine

The matching system exists to reduce discovery friction, not to create public competition between researchers.

## Initial signal model

```text
Scientific relevance      35%
Publication context       20%
Method compatibility      15%
Intent compatibility      15%
Career context            10%
Freshness/confidence       5%
```

Weights are product defaults, not immutable truth. They should be calibrated using user feedback and successful outcomes.

## Candidate pipeline

1. Apply hard eligibility and visibility filters.
2. Generate candidates with lexical and semantic retrieval.
3. Compute scientific similarity.
4. Evaluate intent and availability compatibility.
5. Apply trust, freshness, and anti-spam adjustments.
6. Rank candidates.
7. Present a small number of high-value results with explanations.

## Explainability

Users should see reasons, not an unexplained score. Examples:

- Similar disease focus.
- Related publication history.
- Complementary research methods.
- Compatible collaboration intent.

## Anti-noise rules

- No unrestricted cold-message firehose.
- Scientific introductions precede private conversation.
- Recipients control availability and filtering preferences.
- Bulk/template abuse reduces delivery eligibility.
- Paid plans must not buy their way around network quality protections.

## Feedback loop

Lightweight feedback options:

- Relevant
- Not relevant
- Already know this person
- Wrong career stage
- Wrong field
- Not available

Feedback improves retrieval/ranking but must not become a public reputation score.
