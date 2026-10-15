import type { OpportunityIngestionRecord } from "../ingestion";
import { requestJson } from "./http";
import { toPositionRecord } from "./positions";
import type { OpportunitySourceConnector } from "./types";

// Occupational series for biomedical research roles in the US federal
// government (NIH, CDC, FDA, VA, USUHS…).
const JOB_SERIES = ["0401", "0403", "0405", "0413", "0415", "0440", "0601", "0602", "0630", "0644", "1320"];

type Descriptor = {
  PositionID: string;
  PositionTitle: string;
  PositionURI: string;
  ApplyURI?: string[];
  PositionLocationDisplay?: string;
  PositionLocation?: Array<{ CityName?: string; CountryCode?: string }>;
  OrganizationName?: string;
  DepartmentName?: string;
  PublicationStartDate?: string;
  ApplicationCloseDate?: string;
  QualificationSummary?: string;
  UserArea?: { Details?: { JobSummary?: string } };
};

type SearchResponse = {
  SearchResult?: {
    SearchResultCountAll?: number;
    SearchResultItems?: Array<{ MatchedObjectId: string; MatchedObjectDescriptor: Descriptor }>;
  };
};

export function toUsaJobsRecord(item: Descriptor): OpportunityIngestionRecord | null {
  const location = item.PositionLocation?.[0];
  const city = location?.CityName?.split(",")[0]?.trim() || null;
  return toPositionRecord({
    sourceRecordId: item.PositionID,
    sourceUrl: item.PositionURI,
    applicationUrl: item.ApplyURI?.[0] ?? item.PositionURI,
    title: item.PositionTitle,
    descriptionHtml: [item.UserArea?.Details?.JobSummary, item.QualificationSummary].filter(Boolean).join(" "),
    organization: { name: item.OrganizationName || item.DepartmentName || "US federal government", type: "RESEARCH_INSTITUTE", countryCode: "US" },
    city,
    countryCode: "US",
    location: item.PositionLocationDisplay ?? null,
    deadline: item.ApplicationCloseDate?.slice(0, 10) ?? null,
    publishedAt: item.PublicationStartDate ?? null,
    biomedicalPublisher: true,
  });
}

export const usaJobsSource: OpportunitySourceConnector = {
  id: "usajobs",
  source: { type: "INSTITUTIONAL_CAREERS", name: "USAJOBS", verified: true },
  kind: "positions",
  homepage: "https://www.usajobs.gov",
  description: "Postdoctoral, fellowship and research staff positions at US federal health agencies such as NIH, CDC, FDA and the VA, from the official USAJOBS API.",
  completeSnapshot: true,
  intervalHours: 12,
  // The API requires a free key registered at developer.usajobs.gov.
  isEnabled: (env) => Boolean(env.USAJOBS_API_KEY?.trim() && env.USAJOBS_USER_AGENT?.trim()),
  async collect(context) {
    const headers = {
      "Authorization-Key": context.env.USAJOBS_API_KEY!.trim(),
      "User-Agent": context.env.USAJOBS_USER_AGENT!.trim(),
    };
    const descriptors: Descriptor[] = [];
    for (let page = 1; page <= 10; page += 1) {
      const url = `https://data.usajobs.gov/api/search?JobCategoryCode=${JOB_SERIES.join(";")}&Keyword=research&ResultsPerPage=500&Page=${page}`;
      const response = await requestJson<SearchResponse>(context.fetch, url, { headers });
      const items = response.SearchResult?.SearchResultItems ?? [];
      descriptors.push(...items.map((item) => item.MatchedObjectDescriptor));
      if (items.length < 500) break;
    }
    const records = descriptors
      .map(toUsaJobsRecord)
      .filter((record): record is OpportunityIngestionRecord => Boolean(record));
    context.log(`USAJOBS: ${records.length} research positions of ${descriptors.length} matching postings`);
    return records;
  },
};
