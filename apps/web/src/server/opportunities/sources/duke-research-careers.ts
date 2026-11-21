import type { OpportunityIngestionRecord } from "../ingestion";
import { isMedicalText } from "./classify";
import { mapWithConcurrency } from "./http";
import { englishDate, openPublisher } from "./official-pages";
import { toPositionRecord } from "./positions";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://careers.duke.edu/search/?q=research";
const organization = { name: "Duke University", type: "UNIVERSITY" as const, countryCode: "US", website: "https://www.duke.edu" };
const pageSize = 25;

export function dukeCareerPage(html: string, now: Date) {
  const pagination = html.match(/Page \d+ of (\d+), Results \d+ to \d+ of \d+/i);
  const rows = [...html.matchAll(/<tr class="data-row">([\s\S]*?)<\/tr>/gi)];
  if (!pagination || !rows.length) throw new Error("Duke's research job list was not recognized");
  const records = rows.flatMap(([, row]): OpportunityIngestionRecord[] => {
    const link = row.match(/<a href="(\/job\/[^"/]+\/(\d+)\/)" class="jobTitle-link"[^>]*>([\s\S]*?)<\/a>/i);
    if (!link) return [];
    const title = htmlToText(link[3]);
    const department = htmlToText(row.match(/<span class="jobFacility">([^<]+)<\/span>/i)?.[1]);
    if (!isMedicalText(title, department)) return [];
    const location = htmlToText(row.match(/<span class="jobLocation">\s*([^<]+)<\/span>/i)?.[1]);
    const publishedAt = englishDate(htmlToText(row.match(/<span class="jobDate">\s*([^<]+)<\/span>/i)?.[1]));
    if (!publishedAt || publishedAt > now.toISOString().slice(0, 10)) return [];
    const sourceUrl = new URL(link[1], homepage).href;
    const record = toPositionRecord({
      sourceRecordId: link[2], title, sourceUrl, applicationUrl: sourceUrl, organization,
      countryCode: "US", city: location.split(",")[0]?.trim() || null,
      publishedAt, subjects: [department],
    });
    return record ? [record] : [];
  });
  return { pageCount: Number(pagination[1]), records };
}

export const dukeResearchCareersSource: OpportunitySourceConnector = {
  id: "duke-biomedical-research-careers",
  source: { type: "INSTITUTIONAL_CAREERS", name: "Duke University research listings", verified: true },
  kind: "positions",
  homepage,
  description: "Open biomedical research roles advertised on the official Duke Careers board.",
  completeSnapshot: true,
  staleGraceHours: 24,
  intervalMinutes: 720,
  isEnabled: () => true,
  async collect({ fetch, now }) {
    const read = await openPublisher(fetch, homepage);
    const first = dukeCareerPage(await read(homepage), now);
    if (first.pageCount > 26) throw new Error("Duke's research search exceeded its page budget");
    const offsets = Array.from({ length: first.pageCount - 1 }, (_, index) => (index + 1) * pageSize);
    const pages = await mapWithConcurrency(offsets, 3, async offset => {
      const url = new URL(homepage);
      url.searchParams.set("startrow", String(offset));
      return dukeCareerPage(await read(url.href), now);
    });
    const records = [first, ...pages].flatMap(page => page.records);
    return [...new Map(records.map(record => [record.sourceRecordId, record])).values()];
  },
};
