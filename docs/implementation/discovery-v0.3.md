# Discovery v0.3

## Goal

Discovery should return a deliberately small, explainable set of scientifically relevant people. It is not a social feed and it must not optimize for engagement volume.

## Request contract

Researcher discovery accepts:

- free-text scientific intent (`q`)
- research topic slugs (`topic`)
- method slugs (`method`)
- country codes (`country`)
- career stages (`career`)
- availability modes (`availability`)
- a capped result limit (`limit`, maximum 12)

Repeated query parameters and comma-separated values are both accepted. Inputs are normalized and capped before repository execution.

## Retrieval plan

Version 0.3 starts with explainable lexical and structured retrieval over canonical Scientific Identity fields:

1. explicit filters narrow the candidate set;
2. text tokens are compared with researcher name, headline, affiliation, location, topics, methods, and career stage;
3. topic and method overlap provide strong scientific signals;
4. availability influences connection usefulness without overriding scientific relevance;
5. verified source evidence contributes to confidence, not popularity;
6. each result exposes reasons and a score breakdown to make ordering inspectable.

The retrieval module must remain replaceable so semantic embeddings can be added later without changing the API contract or UI semantics.

## Product constraints

- no infinite feed;
- no follower/like/popularity mechanics;
- no opaque single-score explanation;
- no fixture fallback when a configured production database returns zero matches;
- results remain capped and reasons remain visible;
- private/quiet profiles remain controlled by their visibility and availability settings.
