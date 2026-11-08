import { randomUUID } from "node:crypto";
import { getDb } from "@studepartment/db";
import { researchMethods, researchTopics } from "@studepartment/db/taxonomy";
import { ingestOpportunityBatch, type OpportunityIngestionRecord } from "../ingestion";
import { opportunitySources } from "./registry";
import type { FetchLike, OpportunitySourceConnector } from "./types";

const MAX_RECORDS_PER_SOURCE = 3000;
/** A source that failed is tried again sooner than its normal interval, but not every tick. */
const FAILURE_RETRY_MINUTES = 30;
/** Ticks are not exact; a source counts as due slightly early rather than a whole tick late. */
const DUE_SLACK_MS = 2 * 60_000;
/** A listing missing from a complete snapshot stays up this long before it is taken down. */
const DEFAULT_STALE_GRACE_HOURS = 6;
const SOURCE_LEASE_MS = 15 * 60_000;
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
};

type PreviousRun = Pick<SourceRunResult, "startedAt" | "status">;

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

/**
 * Whether a source is due. Until it has a recorded run, fall back to the
 * newest listing it supplied before durable run tracking was introduced.
 */
export async function isSourceDue(
  connector: OpportunitySourceConnector,
  now: Date,
  lastRun?: PreviousRun,
  lastSeen?: Date | null,
): Promise<boolean> {
  if (lastRun) {
    const waitMinutes = lastRun.status === "failed" ? Math.min(connector.intervalMinutes, FAILURE_RETRY_MINUTES) : connector.intervalMinutes;
    return now.getTime() - Date.parse(lastRun.startedAt) >= waitMinutes * 60_000 - DUE_SLACK_MS;
  }
  const seen = lastSeen === undefined ? await lastSyncedAt(connector) : lastSeen;
  return !seen || now.getTime() - seen.getTime() >= connector.intervalMinutes * 60_000 - DUE_SLACK_MS;
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
  const startedAt = new Date(started);
  const base = { id: connector.id, name: connector.source.name, startedAt: startedAt.toISOString() };
  if (!connector.isEnabled(process.env)) return { ...base, status: "disabled", durationMs: 0 };
  const db = getDb();
  const previous = await db.opportunitySourceRun.findUnique({ where: { sourceId: connector.id } });
  const lastRun: PreviousRun | undefined = previous?.startedAt && (previous.status === "ok" || previous.status === "failed")
    ? { startedAt: previous.startedAt.toISOString(), status: previous.status }
    : undefined;
  const skipped = () => ({ ...base, status: "skipped" as const, durationMs: Date.now() - started });
  if (!force && !(await isSourceDue(connector, now, lastRun))) return skipped();

  // An atomic lease prevents another instance from fetching the same source.
  // Compare the last completed run as well so a stale due check cannot claim it.
  const token = randomUUID();
  const claimed = await db.$executeRaw`
    INSERT INTO "OpportunitySourceRun" ("sourceId", "leaseToken", "leaseUntil")
    VALUES (${connector.id}, ${token}, ${new Date(started + SOURCE_LEASE_MS)})
    ON CONFLICT ("sourceId") DO UPDATE
    SET "leaseToken" = EXCLUDED."leaseToken", "leaseUntil" = EXCLUDED."leaseUntil"
    WHERE ("OpportunitySourceRun"."leaseUntil" IS NULL OR "OpportunitySourceRun"."leaseUntil" <= ${startedAt})
      AND (${force} OR "OpportunitySourceRun"."startedAt" IS NOT DISTINCT FROM ${previous?.startedAt ?? null}::timestamp)
  `;
  if (!claimed) return skipped();

  let run: SourceRunResult;
  try {
    const records = dedupe(await connector.collect({ fetch: fetchImpl, now, env: process.env, log }));
    // An empty full snapshot is far more likely an outage than a real empty list;
    // never let it mark every listing stale.
    const completeSnapshot = connector.completeSnapshot && records.length > 0;
    const staleBefore = new Date(now.getTime() - (connector.staleGraceHours ?? DEFAULT_STALE_GRACE_HOURS) * 3_600_000);
    const result = await ingestOpportunityBatch({ source: connector.source, completeSnapshot, staleBefore, records });
    log(`${connector.source.name}: ${result.created} new, ${result.updated} updated, ${result.unchanged} unchanged, ${result.markedStale} no longer listed`);
    run = { ...base, status: "ok", durationMs: Date.now() - started, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(`${connector.source.name} failed: ${message}`);
    run = { ...base, status: "failed", durationMs: Date.now() - started, error: message.slice(0, 300) };
  }
  await db.opportunitySourceRun.updateMany({
    where: { sourceId: connector.id, leaseToken: token },
    data: { startedAt, status: run.status, durationMs: run.durationMs, leaseToken: null, leaseUntil: null },
  });
  return run;
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
    await getDb().opportunity.updateMany({
      where: { status: "ACTIVE", deadline: { lt: new Date() } },
      data: { status: "EXPIRED" },
    });
    await ensureTaxonomy();
    const results: SourceRunResult[] = [];
    for (const connector of opportunitySources) {
      if (only?.length && !only.includes(connector.id)) continue;
      results.push(await runSource(connector, { force, fetchImpl, log }));
    }
    return { ran: true, results };
  } finally {
    state.opportunitySyncRunning = false;
  }
}

export type PublicSourceStatus = {
  id: string;
  name: string;
  kind: "grants" | "positions" | "scholarships";
  homepage: string;
  description: string;
  enabled: boolean;
  activeListings: number;
  /** Listings first seen in the last 24 hours. */
  newToday: number;
  /** How often the source is checked, in minutes. */
  intervalMinutes: number;
  /** When the source was last checked, successfully or not. */
  lastSyncedAt: string | null;
  lastStatus: "ok" | "failed" | null;
};

/** What each source currently contributes, for the public sources page. */
export async function getOpportunitySourceStatus(now = new Date()): Promise<PublicSourceStatus[]> {
  const db = getDb();
  const cutoff = new Date(now.getTime() - LISTING_STALE_AFTER_DAYS * 86_400_000);
  const dayAgo = new Date(now.getTime() - 86_400_000);
  const open = { status: "ACTIVE" as const, lastSeenAt: { gte: cutoff }, OR: [{ deadline: null }, { deadline: { gte: now } }] };
  const [counts, fresh, latest, runs] = await Promise.all([
    db.opportunity.groupBy({
      by: ["sourceName"],
      where: open,
      _count: { _all: true },
    }),
    db.opportunity.groupBy({
      by: ["sourceName"],
      where: { ...open, firstSeenAt: { gte: dayAgo } },
      _count: { _all: true },
    }),
    db.opportunity.groupBy({ by: ["sourceName"], _max: { lastSeenAt: true } }),
    db.opportunitySourceRun.findMany({ select: { sourceId: true, startedAt: true, status: true } }),
  ]);
  const countBy = new Map(counts.map((row) => [row.sourceName, row._count._all]));
  const freshBy = new Map(fresh.map((row) => [row.sourceName, row._count._all]));
  const latestBy = new Map(latest.map((row) => [row.sourceName, row._max.lastSeenAt]));
  const runBy = new Map(runs.map((run) => [run.sourceId, run]));
  return opportunitySources.map((connector) => {
    const run = runBy.get(connector.id);
    const seen = latestBy.get(connector.source.name) ?? null;
    const lastSyncedAt = run?.startedAt && (!seen || run.startedAt > seen) ? run.startedAt : seen;
    return {
      id: connector.id,
      name: connector.source.name,
      kind: connector.kind,
      homepage: connector.homepage,
      description: connector.description,
      enabled: connector.isEnabled(process.env),
      activeListings: countBy.get(connector.source.name) ?? 0,
      newToday: freshBy.get(connector.source.name) ?? 0,
      intervalMinutes: connector.intervalMinutes,
      lastSyncedAt: lastSyncedAt?.toISOString() ?? null,
      lastStatus: run?.status === "failed" ? "failed" : run?.status === "ok" || seen ? "ok" : null,
    };
  });
}
