export type ScientificSource = "ORCID" | "PUBMED" | "OPENALEX" | "CROSSREF" | "INSTITUTION";

export type ProvenanceEvidence = {
  source: ScientificSource;
  externalId: string;
  sourceUrl?: string;
  fetchedAt: Date;
  lastVerifiedAt?: Date;
  confidence: number;
};

export type SourcedValue<T> = {
  value: T;
  evidence: ProvenanceEvidence[];
  userConfirmed?: boolean;
};

export function normalizeConfidence(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function strongestEvidence(evidence: ProvenanceEvidence[]) {
  return [...evidence].sort(
    (left, right) => normalizeConfidence(right.confidence) - normalizeConfidence(left.confidence),
  )[0];
}
