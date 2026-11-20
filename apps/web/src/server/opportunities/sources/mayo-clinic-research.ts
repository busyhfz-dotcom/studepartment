import type { OpportunityIngestionRecord } from "../ingestion";
import { openPublisher } from "./official-pages";
import { toPositionRecord } from "./positions";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://jobs.mayoclinic.org/employment/united-states-research-jobs/33647/8336992/6252001/2/1";
const hospital = { name: "Mayo Clinic", type: "HOSPITAL", countryCode: "US", website: "https://www.mayoclinic.org/" } as const;
const maxPages = 10;

export function mayoResearchPage(html: string, expectedPage: number) {
  const header = html.match(/<section id="search-results"([^>]+)>/i)?.[1];
  const total = Number(header?.match(/\bdata-total-results="(\d+)"/i)?.[1]);
  const pages = Number(header?.match(/\bdata-total-pages="(\d+)"/i)?.[1]);
  const current = Number(header?.match(/\bdata-current-page="(\d+)"/i)?.[1]);
  if (!header || !Number.isInteger(total) || !Number.isInteger(pages) || pages > maxPages || current !== expectedPage) {
    throw new Error("Mayo Clinic's research job list was not recognized or exceeded its page budget");
  }
  const records: OpportunityIngestionRecord[] = [];
  const ids: string[] = [];
  for (const [, card] of html.matchAll(/<li class="search-results-list-item">([\s\S]*?)<\/li>/gi)) {
    const link = card.match(/href="(\/job\/[a-z0-9-]+\/[a-z0-9-]+\/33647\/(\d+))"\s+data-job-id="\2"/i);
    const title = htmlToText(card.match(/<span class="job-title">([\s\S]*?)<\/span>/i)?.[1]);
    if (!link || !title) throw new Error("A Mayo Clinic vacancy could not be identified");
    ids.push(link[2]);
    const location = htmlToText(card.match(/<span class="job-location">([\s\S]*?)<\/span>/i)?.[1]);
    const sourceUrl = new URL(link[1], homepage).href;
    const record = toPositionRecord({
      sourceRecordId: link[2], sourceUrl, applicationUrl: sourceUrl, title, organization: hospital,
      countryCode: "US", city: location || undefined, biomedicalPublisher: true, requireResearchTitle: true,
    });
    if (record) records.push(record);
  }
  if (!ids.length && total) throw new Error("A Mayo Clinic research page was unexpectedly empty");
  return { total, pages, records, ids };
}

export const mayoClinicResearchSource: OpportunitySourceConnector = {
  id: "mayo-clinic-research-careers",
  source: { type: "INSTITUTIONAL_CAREERS", name: "Mayo Clinic Research Careers", verified: true },
  kind: "positions",
  homepage,
  description: "Research vacancies in US Mayo Clinic hospitals and laboratories from the official careers board.",
  completeSnapshot: true,
  allowEmptySnapshot: true,
  staleGraceHours: 24,
  intervalMinutes: 360,
  isEnabled: () => true,
  async collect({ fetch, log }) {
    const read = await openPublisher(fetch, homepage);
    const first = mayoResearchPage(await read(homepage), 1);
    const ids = new Set(first.ids);
    const records = [...first.records];
    for (let page = 2; page <= first.pages; page++) {
      const next = mayoResearchPage(await read(homepage.replace(/1$/, String(page))), page);
      if (next.total !== first.total || next.pages !== first.pages) throw new Error("Mayo Clinic vacancies changed during pagination");
      for (const id of next.ids) ids.add(id);
      records.push(...next.records);
    }
    if (ids.size !== first.total) throw new Error("A complete Mayo Clinic snapshot could not be verified");
    log(`Mayo Clinic: ${records.length} research roles from ${ids.size} vacancies`);
    return records;
  },
};
