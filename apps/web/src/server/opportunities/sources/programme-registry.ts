import type { OpportunityIngestionRecord } from "../ingestion";
import { topicSlugsFor } from "./classify";
import { indexerUserAgent, mapWithConcurrency } from "./http";
import { PROGRAMMES, type Programme } from "./programme-registry-data";
import type { FetchLike, OpportunitySourceConnector } from "./types";

/** Part of every record's permanent key and of the MD-PhD view's filter. Never rename. */
export const PROGRAMME_SOURCE_NAME = "Official programme pages";

const PAGE_TIMEOUT_MS = 20_000;
const MAX_PAGE_CHARACTERS = 1_500_000;

async function fetchText(fetchImpl: FetchLike, url: string): Promise<{ status: number; text: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PAGE_TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, {
      headers: { "user-agent": indexerUserAgent(), accept: "text/html,text/plain;q=0.9,*/*;q=0.5" },
      redirect: "follow",
      signal: controller.signal,
    });
    return { status: response.status, text: (await response.text()).slice(0, MAX_PAGE_CHARACTERS) };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function robotsPattern(rule: string) {
  const anchored = rule.endsWith("$");
  const body = (anchored ? rule.slice(0, -1) : rule).split("*").map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*");
  return new RegExp("^" + body + (anchored ? "$" : ""));
}

/**
 * Whether a site's robots.txt lets this indexer read `path`. The most specific
 * matching rule wins and Allow beats Disallow on a tie, as in RFC 9309. A group
 * addressed to ProvenantBot replaces the wildcard group.
 */
export function robotsAllows(robotsTxt: string, path: string): boolean {
  const groups = new Map<string, Array<{ allow: boolean; rule: string }>>();
  let agents: string[] = [];
  let readingAgents = false;
  for (const raw of robotsTxt.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (field === "user-agent") {
      if (!readingAgents) agents = [];
      readingAgents = true;
      agents.push(value.toLowerCase());
      if (!groups.has(value.toLowerCase())) groups.set(value.toLowerCase(), []);
    } else if (field === "allow" || field === "disallow") {
      readingAgents = false;
      if (value) for (const agent of agents) groups.get(agent)?.push({ allow: field === "allow", rule: value });
    } else {
      readingAgents = false;
    }
  }
  const own = Array.from(groups.keys()).find((agent) => agent !== "*" && "provenantbot".includes(agent));
  const rules = groups.get(own ?? "*") ?? [];
  let best: { allow: boolean; length: number } | null = null;
  for (const { allow, rule } of rules) {
    if (!robotsPattern(rule).test(path)) continue;
    if (!best || rule.length > best.length || (rule.length === best.length && allow)) best = { allow, length: rule.length };
  }
  return best ? best.allow : true;
}

/**
 * A programme is listed only when its provider's page can be read by an
 * automated visitor, answers normally and still names the programme. That is
 * what "last checked at source" means for these entries.
 */
export async function programmePagePublished(
  fetchImpl: FetchLike,
  programme: Programme,
  robotsCache: Map<string, Promise<string | null>>,
): Promise<boolean> {
  const url = new URL(programme.url);
  if (!robotsCache.has(url.origin)) {
    robotsCache.set(url.origin, fetchText(fetchImpl, url.origin + "/robots.txt").then((result) => (result?.status === 200 ? result.text : null)));
  }
  const robots = await robotsCache.get(url.origin);
  if (robots && !robotsAllows(robots, url.pathname + url.search)) return false;
  const page = await fetchText(fetchImpl, programme.url);
  return Boolean(page && page.status === 200 && page.text.toLowerCase().includes(programme.match.toLowerCase()));
}

export function toProgrammeRecords(programme: Programme): OpportunityIngestionRecord[] {
  const description = `${programme.summary} This summary was written by Provenant from the provider's own page. Funding, eligibility and application dates are set by the provider, so confirm them there before you apply.`;
  return programme.levels.map((type) => ({
    sourceRecordId: `${programme.id}:${type}`,
    sourceUrl: programme.url,
    applicationUrl: programme.url,
    type,
    title: programme.title,
    description,
    organization: {
      name: programme.provider,
      type: programme.providerType,
      countryCode: programme.country,
      website: new URL(programme.url).origin,
    },
    countryCode: programme.country,
    deadline: null,
    topicSlugs: topicSlugsFor(`${programme.title} ${programme.summary}`),
    methodSlugs: [],
    status: "ACTIVE" as const,
    metadata: { degreeFunding: true, curatedProgramme: true, applicationWindow: "set-by-provider" },
  }));
}

export const programmeRegistrySource: OpportunitySourceConnector = {
  id: "programme-registry",
  source: { type: "FUNDER", name: PROGRAMME_SOURCE_NAME, verified: true },
  kind: "scholarships",
  homepage: "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en",
  description: "Long-running scholarships, funded PhD programmes and MD-PhD training at governments, foundations and leading universities in Asia, Europe and North America. Each one is listed only while its provider's own page is online and still names it.",
  completeSnapshot: true,
  // One request per programme page every three hours: a negligible load on each provider.
  intervalMinutes: 180,
  // One slow or briefly unavailable site must not take its programme down.
  staleGraceHours: 96,
  isEnabled: () => true,
  async collect(context) {
    const robotsCache = new Map<string, Promise<string | null>>();
    const published = await mapWithConcurrency(PROGRAMMES, 6, (programme) => programmePagePublished(context.fetch, programme, robotsCache));
    const confirmed = PROGRAMMES.filter((_, index) => published[index]);
    context.log(`Programme pages: ${confirmed.length} of ${PROGRAMMES.length} confirmed at their provider`);
    // Almost nothing reachable means our own network failed, not that every programme closed.
    if (confirmed.length < PROGRAMMES.length / 5) throw new Error("Too few programme pages were reachable to trust this run");
    return confirmed.flatMap(toProgrammeRecords);
  },
};
