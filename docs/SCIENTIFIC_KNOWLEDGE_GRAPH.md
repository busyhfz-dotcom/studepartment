# Scientific Knowledge Graph v0.9

The Scientific Evidence Graph is a derived read model over Studepartment's canonical relational data.

It is deliberately not a second source of truth and does not introduce a separate graph database in v0.9.

## Why a derived graph

The canonical product already stores authoritative entities and relationships in PostgreSQL: ResearcherProfile, Publication / ResearcherPublication, ResearchTopic / ResearcherTopic, ResearchMethod / ResearcherMethod, Laboratory / LabMember, Organization / ResearcherAffiliation, and Opportunity / OpportunityTopic / OpportunityMethod.

Duplicating these records into another graph store before graph-specific scale requires it would create synchronization and provenance risk. v0.9 therefore derives graph neighborhoods at query time.

## Node types

- researcher
- publication
- topic
- method
- laboratory
- institution
- opportunity

Every node carries a canonical entity id, human-readable label, optional subtitle/href, evidence level/source, and compact metadata.

## Edge types

- affiliated-with
- researches
- uses-method
- authored
- member-of
- part-of
- offers
- focuses-on
- uses-method-in-opportunity

Edges are relationships, not ranking signals. Each edge carries an evidence source and evidence level.

## Evidence levels

- verified — canonical source explicitly carries a verified signal
- corroborated — multiple independent source paths corroborate the relationship
- source-backed — relationship is attached to a named canonical/source record
- asserted — profile-owned or source-linked assertion that is not independently verified

A PubMed-corroborated ResearcherPublication edge is corroborated. An ORCID-only publication relationship is source-backed. A profile-owned research topic is asserted. No evidence level becomes a public researcher score.

## Researcher neighborhood

v0.9 includes the researcher, up to 3 current affiliations, 12 research topics, 12 methods, 20 active publications, 8 laboratory memberships, and 12 current opportunities offered by connected organizations, plus opportunity topic/method relationships.

Current opportunities exclude closed, expired, and stale status rows and deadlines already in the past.

## Explainability caps

- 80 nodes
- 180 edges
- 20 publications
- 12 opportunities

When a cap is reached, truncated=true. These are product explainability guardrails, not infrastructure limits.

## Access control

GET /api/v1/graph?researcher=<researcherId>

- a public researcher's graph can be requested by id
- a private profile is available only to its owner
- when researcher is omitted, the endpoint resolves the authenticated user's owned Scientific Identity
- responses use private/no-store caching in v0.9

## Public researcher profiles

v0.9 removes the legacy fixture-backed public researcher page. /researchers/:id now reads the canonical database and shows identity, affiliation, trust signals, topics, methods, availability/goals, recent active publication evidence, and direct links to the Evidence Graph and controlled Introduction flow.

This fixes the previous mismatch where real Discovery ids could navigate to a fixture-only profile route.

## UI

/graph contains a central researcher identity, relationship lanes for identity anchors/research context/outputs/opportunities, evidence labels, a relationship ledger, node-type filters, and explicit cap/truncation state.

The UI intentionally avoids a force-directed hairball in v0.9 because dense node clouds make evidence harder to inspect. A future interactive visualization can consume the same graph contract without changing canonical storage.

## Future graph-database threshold

A dedicated graph store should be considered only when requirements justify it: expensive multi-hop traversal, path finding/graph algorithms, graph-specific institutional analytics, or substantially larger biomedical ontology relationships.

If introduced later, PostgreSQL canonical records and provenance remain authoritative; the graph store should be a rebuildable read model/index.