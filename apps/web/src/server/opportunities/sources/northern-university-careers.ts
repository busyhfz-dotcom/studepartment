import type { OpportunityIngestionRecord } from "../ingestion";
import { isMedicalText } from "./classify";
import { mapWithConcurrency } from "./http";
import { openPublisher } from "./official-pages";
import { toPositionRecord } from "./positions";
import { decodeEntities, htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const copenhagen = "https://employment.ku.dk/all-vacancies/";
const epfl = "https://careers.epfl.ch/search/?q=";

export function copenhagenResearchRecords(html: string, today: string): OpportunityIngestionRecord[] {
  const rows = [...html.matchAll(/<tr class="vacancy-specs">([\s\S]*?)<\/tr>/gi)];
  if (!rows.length && !/no (?:current )?vacancies/i.test(html)) throw new Error("University of Copenhagen vacancy table not recognized");
  return rows.flatMap(([, row]) => {
    const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(([, cell]) => cell);
    if (cells.length !== 4) return [];
    const link = cells[0].match(/<a href="(\/all-vacancies\/\?show=(\d+))"[^>]*>([\s\S]*?)<\/a>/i);
    const date = htmlToText(cells[3]).match(/^(\d{2})-(\d{2})-(20\d{2})$/);
    if (!link || !date) return [];
    const deadline = `${date[3]}-${date[2]}-${date[1]}`;
    if (deadline < today) return [];
    const title = htmlToText(link[3]);
    const faculty = htmlToText(cells[1]);
    const department = htmlToText(cells[2]);
    const sourceUrl = new URL(link[1], copenhagen).href;
    const record = toPositionRecord({
      sourceRecordId: link[2], sourceUrl, applicationUrl: sourceUrl, title,
      organization: { name: "University of Copenhagen", type: "UNIVERSITY", website: "https://www.ku.dk", countryCode: "DK" },
      countryCode: "DK", city: "Copenhagen", deadline, subjects: [faculty, department],
    });
    if (!record) return [];
    if (/^research assistant\b/i.test(title)) {
      record.type = "RESEARCH_ASSISTANTSHIP";
      record.eligibleCareerStages = [];
    }
    return [{ ...record, deadlineTimezone: "Europe/Copenhagen" }];
  });
}

export function epflCareerPage(html: string) {
  const pageCount = Number(html.match(/Page \d+ of (\d+), Results/i)?.[1] ?? 0);
  const rows = [...html.matchAll(/<tr class="data-row">([\s\S]*?)<\/tr>/gi)];
  if (!rows.length && !/no (?:open |matching )?(?:jobs|results)/i.test(html)) throw new Error("EPFL's advertised vacancies were not recognized");
  const records = rows.flatMap(([, row]): OpportunityIngestionRecord[] => {
    const link = row.match(/<a href="(\/job\/[^"/]+\/(\d+)\/)" class="jobTitle-link">([\s\S]*?)<\/a>/i);
    if (!link) return [];
    const title = htmlToText(link[3]);
    if (!isMedicalText(title) && !/\b(?:life sciences|neuro-X|biophysic\w*|bioengineering)\b/i.test(title)) return [];
    const sourceUrl = new URL(decodeEntities(link[1]), epfl).href;
    const record = toPositionRecord({
      sourceRecordId: link[2], sourceUrl, applicationUrl: sourceUrl, title,
      organization: { name: "EPFL", type: "UNIVERSITY", website: "https://www.epfl.ch", countryCode: "CH" },
      city: htmlToText(row.match(/<span class="jobShifttype">([^<]+)<\/span>/i)?.[1]) || null,
      countryCode: "CH", biomedicalPublisher: true,
    });
    return record ? [record] : [];
  });
  return { pageCount, records };
}

export const northernUniversityCareerSources: OpportunitySourceConnector[] = [
  {
    id: "copenhagen-university-research-careers",
    source: { type: "INSTITUTIONAL_CAREERS", name: "University of Copenhagen research careers", verified: true },
    kind: "positions", homepage: copenhagen,
    description: "Current biomedical research vacancies and doctoral appointments at the University of Copenhagen.",
    completeSnapshot: true, allowEmptySnapshot: true, intervalMinutes: 360,
    isEnabled: () => true,
    async collect({ fetch, now }) {
      const read = await openPublisher(fetch, copenhagen);
      const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Copenhagen" }).format(now);
      return copenhagenResearchRecords(await read(copenhagen), today);
    },
  },
  {
    id: "epfl-biomedical-careers",
    source: { type: "INSTITUTIONAL_CAREERS", name: "EPFL biomedical research careers", verified: true },
    kind: "positions", homepage: epfl,
    description: "Open EPFL research positions in health, life sciences and bioengineering.",
    completeSnapshot: true, allowEmptySnapshot: true, intervalMinutes: 720,
    isEnabled: () => true,
    async collect({ fetch }) {
      const read = await openPublisher(fetch, epfl);
      const first = epflCareerPage(await read(epfl));
      if (first.pageCount > 12) throw new Error("EPFL's job list exceeded its page budget");
      const offsets = Array.from({ length: Math.max(0, first.pageCount - 1) }, (_, index) => (index + 1) * 25);
      const rest = await mapWithConcurrency(offsets, 3, async (offset) => epflCareerPage(await read(`${epfl}&startrow=${offset}`)));
      const records = [first, ...rest].flatMap(page => page.records);
      return [...new Map(records.map(record => [record.sourceRecordId, record])).values()];
    },
  },
];
