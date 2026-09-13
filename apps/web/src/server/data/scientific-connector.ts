import type { ProvenanceEvidence, ScientificSource } from "./provenance";

export type ExternalResearcherRecord = {
  externalId: string;
  fullName?: string;
  affiliations: Array<{ name: string; externalId?: string }>;
  works: Array<{ title?: string; doi?: string; pmid?: string; externalId?: string }>;
  evidence: ProvenanceEvidence;
};

export interface ScientificDataConnector {
  readonly source: ScientificSource;
  fetchResearcher(externalId: string): Promise<ExternalResearcherRecord | null>;
}

/**
 * Connectors only retrieve and normalize source-specific data.
 * They do not merge canonical entities themselves. Entity resolution belongs
 * to a separate service so matching evidence remains reviewable and testable.
 */
export type EntityResolutionCandidate = {
  canonicalResearcherId: string;
  source: ScientificSource;
  externalId: string;
  confidence: number;
  reasons: string[];
};
