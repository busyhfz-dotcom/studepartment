import { getDb } from "@studepartment/db";
import { researchMethods, researchTopics } from "@studepartment/db/taxonomy";
import { ingestOpportunityBatch, type OpportunityIngestionRecord } from "../ingestion";
import { opportunitySources } from "./registry";
import type { FetchLike, OpportunitySourceConnector } from "./types";

const MAX_RECORDS_PER_SOURCE = 3000;
/** Listings not seen for this long drop out of search (matches the search cutoff). */
export const LISTING_STALE_AFTER_DAYS = 45;

export type SourceRunResult = {
  id: string;
  name: string;
  status: "ok" | "skipped" | "disabled" | "failed";
  startedAt: string;
  durationMs: number;
  received?: number;
  created?: number;
  updated?: number;
  unchanged?: number;
  markedStale?: number;
  error?: string;
};

export type SyncSummary = { ran: boolean; reason?: string; results: SourceRunResult[] };

const state = globalThis as unknown as {
  opportunitySyncRunning?: boolean;
  opportunitySyncLastRuns?: Map<string, SourceRunResult>;
};

export function lastSourceRuns(): Map<string, SourceRunResult> {
  state.opportunitySyncLastRuns ??= new Map();
  return state.opportunitySyncLastRuns;
}

/** Makes sure the topic and method vocabulary exists, so listings can be tagged. */
async function ensureTaxonomy() {
  const db = getDb();
  const [topicCount, methodCount] = await Promise.all([db.researchTopic.count(), db.researchMethod.count()]);
  if (topicCount >= researchTopics.length && methodCount >= researchMethods.length) return;
  for (const [slug, name] of researchTopics) {
    await db.researchTopic.upsert({ where: { slug }, update: {}, create: { slug, name } });
  }
  for (const [slug, name] of researchMethods) {
    await db.researchMethod.upsert({ where: { slug }, update: {}, create: { slug, name } });
  }
}

async function lastSyncedAt(connector: OpportunitySourceConnector): Promise<Date | null> {
  const latest = await getDb().opportunity.findFirst({
    where: { sourceType: connector.source.type, sourceName: connector.source.name },
    orderBy: { lastSeenAt: "desc" },
    select: { lastSeenAt: true },
  });
  return latest?.lastSeenAt ?? null;
}

function dedupe(records: OpportunityIngestionRecord[]) {
  const unique = new Map<string, OpportunityIngestionRecord>();
  for (const record of records) {
    if (record.sourceRecordId.trim() && record.title.trim() && /^https:\/\//.test(record.sourceUrl)) {
      unique.set(record.sourceRecordId.trim(), record);
    }
  }
  return [...unique.values()].slice(0, MAX_RECORDS_PER_SOURCE);
}

export async function runSource(
  connector: OpportunitySourceConnector,
  { force = false, fetchImpl = fetch, now = new Date(), log = (message: string) => console.info(`[opportunity-sync] ${message}`) }:
  { force?: boolean; fetchImpl?: FetchLike; now?: Date; log?: (message: string) => void } = {},
): Promise<SourceRunResult> {
  const started = Date.now();
  const base = { id: connector.id, name: connector.source.name, startedAt: new Date(started).toISOString() };
  if (!connector.isEnabled(process.env)) return { ...base, status: "disabled", durationMs: 0 };
  if (!force) {
    const last = await lastSyncedAt(connector);
    if (last && now.getTime() - last.getTime() < connector.intervalHours * 3_600_000) {
      return { ...base, status: "skipped", durationMs: Date.now() - started };
    }
  }
  try {
    const records = dedupe(await connector.collect({ fetch: fetchImpl, now, env: process.env, log }));
    // An empty full snapshot is far more likely an outage than a real empty list;
    // never let it mark every listing stale.
    const completeSnapshot = connector.completeSnapshot && records.length > 0;
    const result = await ingestOpportunityBatch({ source: connector.source, completeSnapshot, records });
    log(`${connector.source.name}: ${result.created} new, ${result.updated} updated, ${result.unchanged} unchanged, ${result.markedStale} no longer listed`);
    return { ...base, status: "ok", durationMs: Date.now() - started, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(`${connector.source.name} failed: ${message}`);
    return { ...base, status: "failed", durationMs: Date.now() - started, error: message.slice(0, 300) };
  }
}

/**
 * Collects open positions and funding calls from every enabled publisher and
 * stores them. Sources run one after another so a slow or failing publisher
 * never blocks the others. Safe to call often: sources that ran recently are
 * skipped unless `force` is set.
 */
export async function runOpportunitySync(
  { only, force = false, fetchImpl, log }: { only?: string[]; force?: boolean; fetchImpl?: FetchLike; log?: (message: string) => void } = {},
): Promise<SyncSummary> {
  if (state.opportunitySyncRunning) return { ran: false, reason: "A sync is already running.", results: [] };
  state.opportunitySyncRunning = true;
  try {
    await ensureTaxonomy();
    const results: SourceRunResult[] = [];
    for (const connector of opportunitySources) {
      if (only?.length && !only.includes(connector.id)) continue;
      const result = await runSource(connector, { force, fetchImpl, log });
      if (result.status !== "skipped") lastSourceRuns().set(connector.id, result);
      results.push(result);
    }
    return { ran: true, results };
  } finally {
    state.opportunitySyncRunning = false;
  }
}

export type PublicSourceStatus = {
  id: string;
  name: string;
  kind: "grants" | "positions";
  homepage: string;
  description: string;
  enabled: boolean;
  activeListings: number;
  lastSyncedAt: string | null;
};

/** What each source currently contributes, for the public sources page. */
export async function getOpportunitySourceStatus(now = new Date()): Promise<PublicSourceStatus[]> {
  const db = getDb();
  const cutoff = new Date(now.getTime() - LISTING_STALE_AFTER_DAYS * 86_400_000);
  const [counts, latest] = await Promise.all([
    db.opportunity.groupBy({
      by: ["sourceName"],
      where: { status: "ACTIVE", lastSeenAt: { gte: cutoff }, OR: [{ deadline: null }, { deadline: { gte: now } }] },
      _count: { _all: true },
    }),
    db.opportunity.groupBy({ by: ["sourceName"], _max: { lastSeenAt: true } }),
  ]);
  const countBy = new Map(counts.map((row) => [row.sourceName, row._count._all]));
  const latestBy = new Map(latest.map((row) => [row.sourceName, row._max.lastSeenAt]));
  return opportunitySources.map((connector) => ({
    id: connector.id,
    name: connector.source.name,
    kind: connector.kind,
    homepage: connector.homepage,
    description: connector.description,
    enabled: connector.isEnabled(process.env),
    activeListings: countBy.get(connector.source.name) ?? 0,
    lastSyncedAt: latestBy.get(connector.source.name)?.toISOString() ?? null,
  }));
}
