import type { OpportunityIngestionRecord, OpportunityIngestionSource } from "../ingestion";

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type SourceContext = {
  fetch: FetchLike;
  now: Date;
  env: NodeJS.ProcessEnv;
  log: (message: string) => void;
};

/**
 * One external system that publishes open positions or funding calls.
 *
 * `source.name` is part of every record's stable key, so it must never change
 * once a connector has run in production. Connectors only read from official
 * APIs or feeds the publisher offers for reuse; they never scrape pages whose
 * robots rules or terms forbid automated access.
 */
export type OpportunitySourceConnector = {
  id: string;
  source: OpportunityIngestionSource;
  kind: "grants" | "positions";
  /** Public page people can open to see the publisher's own listings. */
  homepage: string;
  /** Short plain-language description shown on the public sources list. */
  description: string;
  /**
   * True when every run returns the publisher's full current list, so records
   * missing from a run can be marked stale. Feeds that only expose the latest
   * items must leave this false.
   */
  completeSnapshot: boolean;
  /**
   * Minutes between automatic checks. Kept short so new listings appear within
   * the hour, but long enough to be a light, polite load on the publisher.
   */
  intervalMinutes: number;
  /**
   * For complete snapshots: hours a listing must be missing from the source
   * before it is taken down. Absorbs APIs whose result pages vary between
   * calls. Defaults to 6.
   */
  staleGraceHours?: number;
  isEnabled(env: NodeJS.ProcessEnv): boolean;
  collect(context: SourceContext): Promise<OpportunityIngestionRecord[]>;
};
