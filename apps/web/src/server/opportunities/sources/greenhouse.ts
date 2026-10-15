import type { OpportunityIngestionRecord } from "../ingestion";
import { countryCodeFromText } from "./classify";
import { requestJson } from "./http";
import { toPositionRecord } from "./positions";
import type { OpportunitySourceConnector } from "./types";

type GreenhouseJob = {
  id: number;
  title: string;
  absolute_url: string;
  updated_at?: string;
  first_published?: string;
  location?: { name?: string };
  content?: string;
  departments?: Array<{ name: string }>;
};

type Board = { token: string; name: string; website: string; countryCode: string | null };

/**
 * Biomedical research institutes that publish their careers page through
 * Greenhouse's public Job Board API (designed for third-party display).
 */
export const GREENHOUSE_BOARDS: Board[] = [
  { token: "arcinstitute", name: "Arc Institute", website: "https://arcinstitute.org", countryCode: "US" },
];

export function toGreenhouseRecord(job: GreenhouseJob, board: Board): OpportunityIngestionRecord | null {
  const location = job.location?.name ?? null;
  return toPositionRecord({
    sourceRecordId: String(job.id),
    sourceUrl: job.absolute_url,
    applicationUrl: job.absolute_url,
    title: job.title,
    descriptionHtml: job.content ?? null,
    organization: { name: board.name, type: "RESEARCH_INSTITUTE", countryCode: board.countryCode, website: board.website },
    city: location?.split(",")[0]?.trim() || null,
    countryCode: countryCodeFromText(location) ?? board.countryCode,
    location,
    publishedAt: job.first_published ?? job.updated_at ?? null,
    subjects: job.departments?.map((department) => department.name),
    biomedicalPublisher: true,
  });
}

export const greenhouseSources: OpportunitySourceConnector[] = GREENHOUSE_BOARDS.map((board) => ({
  id: `greenhouse-${board.token}`,
  source: { type: "INSTITUTIONAL_CAREERS", name: `${board.name} careers`, verified: true },
  kind: "positions",
  homepage: `https://job-boards.greenhouse.io/${board.token}`,
  description: `Research positions from ${board.name}'s official careers board.`,
  completeSnapshot: true,
  intervalMinutes: 180,
  isEnabled: () => true,
  async collect(context) {
    const response = await requestJson<{ jobs?: GreenhouseJob[] }>(
      context.fetch,
      `https://boards-api.greenhouse.io/v1/boards/${board.token}/jobs?content=true`,
    );
    const jobs = response.jobs ?? [];
    const records = jobs
      .map((job) => toGreenhouseRecord(job, board))
      .filter((record): record is OpportunityIngestionRecord => Boolean(record));
    context.log(`${board.name}: ${records.length} research positions of ${jobs.length} openings`);
    return records;
  },
}));
