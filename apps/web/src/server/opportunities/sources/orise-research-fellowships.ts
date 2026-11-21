import type { OpportunityIngestionRecord } from "../ingestion";
import { topicSlugsFor } from "./classify";
import { hasHumanDisease } from "./human-disease-terms";
import { mapWithConcurrency } from "./http";
import { openPublisher } from "./official-pages";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://www.zintellect.com/Catalog";
const endpoint = "https://www.zintellect.com/Catalog/Index_DataTableResult";
const timezone = "America/New_York";
const pageSize = 100;
const fields = ["title", "referenceCode", "location", "posted", "isFavorite", "elasticScore"];

type Posting = { title?: string; referenceCode?: string; location?: string; posted?: string; expirationDate?: string };
type SearchResult = { recordsFiltered: number; data: Posting[] };

function usDate(value?: string) {
  const date = value?.match(/^(\d{2})-(\d{2})-(20\d{2})/);
  return date ? `${date[3]}-${date[1]}-${date[2]}` : null;
}

function easternDeadline(value?: string) {
  const date = usDate(value);
  const time = value?.match(/ (\d{2}):(\d{2}):(\d{2}) (AM|PM)$/i);
  if (!date || !time) return date;
  const hour = Number(time[1]) % 12 + (time[4].toUpperCase() === "PM" ? 12 : 0);
  const clock = `${date}T${String(hour).padStart(2, "0")}:${time[2]}:${time[3]}`;
  const offset = new Intl.DateTimeFormat("en-US", { timeZone: timezone, timeZoneName: "longOffset" })
    .formatToParts(new Date(clock + "Z")).find(part => part.type === "timeZoneName")?.value;
  return offset?.startsWith("GMT") ? clock + (offset.slice(3) || "Z") : date;
}

const agencies: Record<string, string> = {
  AHRQ: "Agency for Healthcare Research and Quality",
  CDC: "Centers for Disease Control and Prevention",
  FDA: "U.S. Food and Drug Administration",
  HHS: "U.S. Department of Health and Human Services",
  NIH: "National Institutes of Health",
  NIAID: "National Institute of Allergy and Infectious Diseases",
};

function toFellowship(posting: Posting, now: Date): OpportunityIngestionRecord | null {
  const reference = posting.referenceCode;
  const title = htmlToText(posting.title);
  if (!reference || !/^[A-Z0-9-]+$/i.test(reference) || !title) return null;
  if (/\b(?:chemical threats?|bioweapons?|biodefen[sc]e|warfare agents?)\b/i.test(title)) return null;
  const agency = agencies[reference.split("-")[0]];
  if (!/\b(?:fellowship|postdoctoral|postdoc|research appointment)\b/i.test(title)) return null;
  if (!agency && !hasHumanDisease(title) && !/\b(?:human health|medical|clinical research|patients?)\b/i.test(title)) return null;
  const deadline = easternDeadline(posting.expirationDate);
  if (deadline && Date.parse(deadline) + (deadline.length === 10 ? 86_400_000 : 0) <= now.getTime()) return null;
  const publishedAt = usDate(posting.posted);
  if (!publishedAt || Date.parse(publishedAt) > now.getTime()) return null;
  const sourceUrl = `https://www.zintellect.com/Opportunity/Details/${reference}`;
  const organization = agency ?? "Oak Ridge Institute for Science and Education";
  return {
    sourceRecordId: reference, sourceUrl, applicationUrl: sourceUrl, title,
    type: /\bpost-?doc(?:toral)?\b/i.test(title) ? "POSTDOC" : "FELLOWSHIP",
    description: null,
    organization: { name: organization, type: "RESEARCH_INSTITUTE", countryCode: "US", website: homepage },
    countryCode: "US", city: htmlToText(posting.location).split(",")[0] || null,
    publishedAt, deadline, deadlineTimezone: timezone, topicSlugs: topicSlugsFor(title), status: "ACTIVE",
  };
}

export const oriseResearchFellowshipsSource: OpportunitySourceConnector = {
  id: "orise-biomedical-research-fellowships",
  source: { type: "RESEARCH_NETWORK", name: "ORISE Zintellect biomedical fellowships", verified: true },
  kind: "positions", homepage,
  description: "Open research fellowships and postdoctoral appointments from ORISE's official Zintellect opportunity catalog.",
  completeSnapshot: true,
  staleGraceHours: 24,
  intervalMinutes: 720,
  isEnabled: () => true,
  async collect({ fetch, now }) {
    const read = await openPublisher(fetch, homepage);
    async function load(offset: number) {
      const params = new URLSearchParams({
        draw: "1", start: String(offset), length: String(pageSize),
        "order[0][column]": "0", "order[0][dir]": "asc",
        IsCatalogSortedByElasticSearchScore: "False", ShowOnlyResumeMatches: "false",
      });
      for (const [i, name] of fields.entries()) {
        params.set(`columns[${i}][data]`, name);
        params.set(`columns[${i}][searchable]`, "true");
        params.set(`columns[${i}][orderable]`, "true");
        params.set(`columns[${i}][search][value]`, "");
      }
      const data = JSON.parse(await read(endpoint, {
        method: "POST", headers: { accept: "application/json", "X-Requested-With": "XMLHttpRequest", referer: homepage },
        body: params,
      })) as SearchResult;
      if (!Number.isInteger(data.recordsFiltered) || data.recordsFiltered < 0 || data.recordsFiltered > 1200 || !Array.isArray(data.data)) {
        throw new Error("ORISE did not return a complete bounded catalog");
      }
      return data;
    }
    const first = await load(0);
    const offsets = Array.from({ length: Math.max(0, Math.ceil(first.recordsFiltered / pageSize) - 1) }, (_, i) => (i + 1) * pageSize);
    const pages = await mapWithConcurrency(offsets, 2, load);
    const listings = [first, ...pages].flatMap(page => page.data);
    if (new Set(listings.map(posting => posting.referenceCode)).size !== first.recordsFiltered) throw new Error("ORISE's catalog changed while it was being read");
    const ranked = listings.map(posting => toFellowship(posting, now))
      .filter((record): record is OpportunityIngestionRecord => Boolean(record))
      .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
    const unique = new Map<string, OpportunityIngestionRecord>();
    for (const record of ranked) {
      const identity = [record.sourceRecordId.replace(/\d[A-Z]$/, end => end[0]), record.title.toLowerCase(), record.city].join("|");
      if (!unique.has(identity)) unique.set(identity, record);
    }
    return [...unique.values()];
  },
};
