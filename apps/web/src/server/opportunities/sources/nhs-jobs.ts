import type { OpportunityIngestionRecord } from "../ingestion";
import { requestText } from "./http";
import { toPositionRecord } from "./positions";
import { decodeEntities } from "./text";
import type { OpportunitySourceConnector } from "./types";

// NHS Jobs publishes a public, keyless XML search ("Self-Serve Job Adverts
// API") for re-display of its adverts. Its keyword search is broad, so each
// result is still filtered by title to research posts.
const SEARCH_URL = "https://www.jobs.nhs.uk/api/v1/search_xml";
const QUERIES = ["clinical research fellow", "research fellow", "research assistant", "research associate", "phd", "postdoctoral", "doctoral"];
const MAX_PAGES_PER_QUERY = 12;

type Vacancy = {
  id: string;
  title: string;
  description: string;
  employer: string;
  closeDate: string;
  postDate: string;
  url: string;
  location: string;
};

function field(block: string, name: string) {
  return decodeEntities(block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1] ?? "").trim();
}

export function parseNhsJobs(xml: string): { vacancies: Vacancy[]; totalPages: number } {
  const vacancies = [...xml.matchAll(/<vacancyDetails>([\s\S]*?)<\/vacancyDetails>/g)].map(([, block]) => ({
    id: field(block, "id"),
    title: field(block, "title"),
    description: field(block, "description"),
    employer: field(block, "employer"),
    closeDate: field(block, "closeDate"),
    postDate: field(block, "postDate"),
    url: field(block, "url"),
    location: field(block, "location"),
  }));
  return { vacancies, totalPages: Number(xml.match(/<totalPages>(\d+)<\/totalPages>/)?.[1] ?? 1) };
}

export function toNhsRecord(vacancy: Vacancy): OpportunityIngestionRecord | null {
  if (!vacancy.id || !/^https:\/\//.test(vacancy.url)) return null;
  return toPositionRecord({
    sourceRecordId: vacancy.id,
    sourceUrl: vacancy.url,
    applicationUrl: vacancy.url,
    title: vacancy.title,
    descriptionHtml: vacancy.description,
    organization: { name: vacancy.employer || "NHS employer", type: "HOSPITAL", countryCode: "GB", website: "https://www.jobs.nhs.uk" },
    city: vacancy.location.split(",")[0]?.trim() || null,
    countryCode: "GB",
    deadline: /^\d{4}-\d{2}-\d{2}$/.test(vacancy.closeDate) ? vacancy.closeDate : null,
    publishedAt: vacancy.postDate ? vacancy.postDate.slice(0, 19) + "Z" : null,
    biomedicalPublisher: true,
    requireResearchTitle: true,
  });
}

export const nhsJobsSource: OpportunitySourceConnector = {
  id: "nhs-jobs",
  source: { type: "INSTITUTIONAL_CAREERS", name: "NHS Jobs", verified: true },
  kind: "positions",
  homepage: "https://www.jobs.nhs.uk",
  description: "Clinical research fellowships, research assistant and associate posts, and PhD posts across NHS trusts in England and Wales.",
  completeSnapshot: false,
  intervalHours: 12,
  isEnabled: () => true,
  async collect(context) {
    const vacancies = new Map<string, Vacancy>();
    for (const query of QUERIES) {
      for (let page = 1; page <= MAX_PAGES_PER_QUERY; page += 1) {
        const xml = await requestText(context.fetch, `${SEARCH_URL}?keyword=${encodeURIComponent(query)}&page=${page}`);
        const { vacancies: pageItems, totalPages } = parseNhsJobs(xml);
        for (const vacancy of pageItems) vacancies.set(vacancy.id, vacancy);
        if (!pageItems.length || page >= totalPages) break;
      }
    }
    const records = [...vacancies.values()]
      .map(toNhsRecord)
      .filter((record): record is OpportunityIngestionRecord => Boolean(record));
    context.log(`NHS Jobs: ${records.length} research posts of ${vacancies.size} matching adverts`);
    return records;
  },
};
