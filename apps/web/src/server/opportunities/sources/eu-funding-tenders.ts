import type { OpportunityIngestionRecord } from "../ingestion";
import { isMedicalText, methodSlugsFor, topicSlugsFor } from "./classify";
import { requestJson } from "./http";
import { cleanDescription, decodeEntities } from "./text";
import type { OpportunitySourceConnector } from "./types";

// The portal's own public search service. "SEDIA" is the published key the
// portal itself uses; no account is needed. EU content is reusable under the
// Commission's reuse policy (Decision 2011/833/EU) with attribution.
const SEARCH_URL = "https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA&text=***";
const TOPIC_PAGE = "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/";
const STATUS_FORTHCOMING = "31094501";
const STATUS_OPEN = "31094502";

type Metadata = Record<string, string[] | undefined>;
type SearchResult = { url?: string; metadata: Metadata };
type SearchResponse = { totalResults: number; results?: SearchResult[] };

const HEALTH_PROGRAMMES = /^(HORIZON-HLTH|HORIZON-JU-IHI|HORIZON-JU-GH-EDCTP3|EU4H|HORIZON-MSCA|ERC-|HORIZON-MISS-[\d-]*CANCER|HORIZON-MISS-\d{4}-\d{2}-CANCER)/;

const first = (metadata: Metadata, key: string) => metadata[key]?.[0]?.trim() ?? "";

export function euFunder(identifier: string): { name: string; website: string } {
  if (identifier.startsWith("ERC-")) return { name: "European Research Council", website: "https://erc.europa.eu" };
  if (identifier.startsWith("HORIZON-MSCA")) return { name: "Marie Skłodowska-Curie Actions", website: "https://marie-sklodowska-curie-actions.ec.europa.eu" };
  if (identifier.startsWith("HORIZON-JU-IHI")) return { name: "Innovative Health Initiative", website: "https://www.ihi.europa.eu" };
  if (identifier.startsWith("HORIZON-JU-GH-EDCTP3")) return { name: "Global Health EDCTP3", website: "https://www.global-health-edctp3.europa.eu" };
  if (identifier.startsWith("EU4H")) return { name: "EU4Health Programme", website: "https://hadea.ec.europa.eu" };
  return { name: "Horizon Europe", website: "https://research-and-innovation.ec.europa.eu" };
}

export function euType(identifier: string, title: string): Pick<OpportunityIngestionRecord, "type" | "eligibleCareerStages"> {
  if (/^HORIZON-MSCA-\d{4}-PF/.test(identifier) || /postdoctoral fellowships?/i.test(title)) return { type: "FELLOWSHIP", eligibleCareerStages: ["postdoc"] };
  if (/^ERC-\d{4}-STG/.test(identifier)) return { type: "GRANT", eligibleCareerStages: ["early-career-researcher"] };
  if (/^ERC-\d{4}-(COG|ADG)/.test(identifier)) return { type: "GRANT", eligibleCareerStages: ["faculty"] };
  return { type: "GRANT", eligibleCareerStages: [] };
}

/**
 * Earliest deadline that has not passed, as a calendar date. The portal sends
 * deadline days at midnight UTC (the close time, usually 17:00 Brussels, is on
 * the topic page), so a deadline counts as open for the whole day.
 */
export function nextDeadline(dates: string[] | undefined, now: Date): string | null {
  const upcoming = (dates ?? [])
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()) && date.getTime() + 86_400_000 > now.getTime())
    .sort((a, b) => a.getTime() - b.getTime());
  return upcoming[0]?.toISOString().slice(0, 10) ?? null;
}

/**
 * Health programmes are included whole. Topics from other programmes are
 * included only when their title is about health; their subject keywords are
 * too broad (a biodiversity topic can carry "pathogens") to decide on.
 */
export function isHealthTopic(metadata: Metadata): boolean {
  const identifier = first(metadata, "identifier");
  if (HEALTH_PROGRAMMES.test(identifier)) return true;
  return isMedicalText(first(metadata, "title"));
}

export function toEuRecord(result: SearchResult, now: Date): OpportunityIngestionRecord | null {
  const metadata = result.metadata;
  const identifier = first(metadata, "identifier");
  const title = decodeEntities(first(metadata, "title"));
  const status = first(metadata, "status");
  if (!identifier || !title || (status !== STATUS_OPEN && status !== STATUS_FORTHCOMING)) return null;
  const deadline = nextDeadline(metadata.deadlineDate, now);
  if (!deadline && metadata.deadlineDate?.length) return null; // every stage has closed
  const opens = first(metadata, "startDate");
  const body = cleanDescription(first(metadata, "descriptionByte"), 900);
  const callTitle = decodeEntities(first(metadata, "callTitle"));
  const action = first(metadata, "typesOfAction");
  const description = [
    status === STATUS_FORTHCOMING && opens ? `Opens for submissions on ${opens.slice(0, 10)}.` : null,
    callTitle ? `Part of the call “${callTitle}”.` : null,
    action ? `Type of action: ${action.replace(/\s+/g, " ")}.` : null,
    body,
    `Topic ID ${identifier}.`,
  ].filter(Boolean).join(" ");
  const funder = euFunder(identifier);
  const searchable = [title, body ?? "", ...(metadata.keywords ?? []), ...(metadata.tags ?? [])].join(" ");
  return {
    sourceRecordId: identifier,
    sourceUrl: TOPIC_PAGE + encodeURIComponent(identifier),
    applicationUrl: null,
    ...euType(identifier, title),
    title,
    description,
    organization: { name: funder.name, type: "FOUNDATION", countryCode: null, website: funder.website },
    city: "European Union",
    countryCode: null,
    deadline,
    deadlineTimezone: "Europe/Brussels",
    publishedAt: opens || null,
    topicSlugs: topicSlugsFor(searchable),
    methodSlugs: methodSlugsFor(searchable),
    status: "ACTIVE",
    metadata: { identifier, callIdentifier: first(metadata, "callIdentifier"), status: status === STATUS_OPEN ? "open" : "forthcoming" },
  };
}

function searchBody() {
  const form = new FormData();
  form.append("query", new Blob([JSON.stringify({
    bool: { must: [{ terms: { type: ["1"] } }, { terms: { status: [STATUS_FORTHCOMING, STATUS_OPEN] } }] },
  })], { type: "application/json" }));
  form.append("languages", new Blob([JSON.stringify(["en"])], { type: "application/json" }));
  return form;
}

export const euFundingTendersSource: OpportunitySourceConnector = {
  id: "eu-funding-tenders",
  source: { type: "FUNDER", name: "EU Funding & Tenders Portal", verified: true },
  kind: "grants",
  homepage: "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/calls-for-proposals",
  description: "Open and forthcoming EU calls in health: Horizon Europe Cluster 1, the Cancer Mission, IHI, EU4Health, EDCTP3, ERC and MSCA.",
  completeSnapshot: true,
  intervalMinutes: 120,
  // The portal's search pages are not stably ordered, so a topic can be
  // missing from one run and back in the next. Closed topics still leave
  // promptly through their deadline.
  staleGraceHours: 24,
  isEnabled: () => true,
  async collect(context) {
    const results: SearchResult[] = [];
    for (let page = 1; page <= 20; page += 1) {
      const response = await requestJson<SearchResponse>(context.fetch, `${SEARCH_URL}&pageSize=100&pageNumber=${page}`, {
        method: "POST",
        body: searchBody(),
      });
      const items = response.results ?? [];
      results.push(...items);
      if (items.length < 100 || results.length >= response.totalResults) break;
    }
    const records = results
      .filter((result) => isHealthTopic(result.metadata))
      .map((result) => toEuRecord(result, context.now))
      .filter((record): record is OpportunityIngestionRecord => Boolean(record));
    context.log(`EU Funding & Tenders: ${records.length} health topics of ${results.length} open or forthcoming`);
    return records;
  },
};
