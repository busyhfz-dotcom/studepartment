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

type Board = { token: string; name: string; website: string; countryCode: string | null; employerType?: "COMPANY" };

/**
 * Biomedical research institutes and research organizations that publish their careers page through
 * Greenhouse's public Job Board API (designed for third-party display).
 */
export const GREENHOUSE_BOARDS: Board[] = [
  { token: "arcinstitute", name: "Arc Institute", website: "https://arcinstitute.org", countryCode: "US" },
  { token: "biohub", name: "Chan Zuckerberg Biohub", website: "https://www.czbiohub.org", countryCode: "US" },
  { token: "altoslabs", name: "Altos Labs", website: "https://www.altoslabs.com", countryCode: "US" },
  { token: "calicolabs", name: "Calico Life Sciences", website: "https://www.calicolabs.com", countryCode: "US" },
  { token: "arcadiascience", name: "Arcadia Science", website: "https://www.arcadiascience.com", countryCode: "US" },
  { token: "sagebionetworks", name: "Sage Bionetworks", website: "https://sagebionetworks.org", countryCode: "US" },
  { token: "freenome", name: "Freenome", website: "https://www.freenome.com", countryCode: "US", employerType: "COMPANY" },
  { token: "natera", name: "Natera", website: "https://www.natera.com", countryCode: null, employerType: "COMPANY" },
  { token: "precisionmedicinegroup", name: "Precision Medicine Group", website: "https://www.precisionmedicinegrp.com", countryCode: null, employerType: "COMPANY" },
  { token: "recursionpharmaceuticals", name: "Recursion", website: "https://www.recursion.com", countryCode: null, employerType: "COMPANY" },
  { token: "eikontherapeutics", name: "Eikon Therapeutics", website: "https://www.eikontx.com", countryCode: "US", employerType: "COMPANY" },
  { token: "revolutionmedicines", name: "Revolution Medicines", website: "https://www.revmed.com", countryCode: null, employerType: "COMPANY" },
  { token: "generatebiomedicines", name: "Generate Biomedicines", website: "https://generatebiomedicines.com", countryCode: "US", employerType: "COMPANY" },
  { token: "tesseratherapeutics", name: "Tessera Therapeutics", website: "https://www.tesseratherapeutics.com", countryCode: "US", employerType: "COMPANY" },
  { token: "relaytherapeutics", name: "Relay Therapeutics", website: "https://relaytx.com", countryCode: "US", employerType: "COMPANY" },
  { token: "chanzuckerberginitiative", name: "Chan Zuckerberg Initiative", website: "https://chanzuckerberg.com", countryCode: "US" },
  { token: "beamtherapeutics", name: "Beam Therapeutics", website: "https://beamtx.com", countryCode: "US", employerType: "COMPANY" },
  { token: "abcellera", name: "AbCellera", website: "https://www.abcellera.com", countryCode: "CA", employerType: "COMPANY" },
];

export function toGreenhouseRecord(job: GreenhouseJob, board: Board): OpportunityIngestionRecord | null {
  const location = job.location?.name ?? null;
  if (/(?:talent community|general application|expression of interest)/i.test(job.title)) return null;
  const record = toPositionRecord({
    sourceRecordId: String(job.id),
    sourceUrl: job.absolute_url,
    applicationUrl: job.absolute_url,
    title: job.title,
    descriptionHtml: job.content ?? null,
    organization: { name: board.name, type: board.employerType ?? "RESEARCH_INSTITUTE", countryCode: board.countryCode, website: board.website },
    city: location?.split(",")[0]?.trim() || null,
    countryCode: countryCodeFromText(location) ?? board.countryCode,
    location,
    publishedAt: job.first_published ?? job.updated_at ?? null,
    subjects: job.departments?.map((department) => department.name),
    biomedicalPublisher: !board.employerType,
  });
  if (record && board.employerType) record.description = null;
  return record;
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
    if (!Array.isArray(response.jobs)) throw new Error("Unrecognized Greenhouse jobs response");
    const jobs = response.jobs;
    const records = jobs
      .map((job) => toGreenhouseRecord(job, board))
      .filter((record): record is OpportunityIngestionRecord => Boolean(record));
    context.log(`${board.name}: ${records.length} research positions of ${jobs.length} openings`);
    return records;
  },
}));
