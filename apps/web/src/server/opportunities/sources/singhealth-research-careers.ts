import type { OpportunityIngestionRecord } from "../ingestion";
import { englishDate, openPublisher } from "./official-pages";
import { toPositionRecord } from "./positions";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://careers.singhealth.com.sg/go/SingHealth-Research/647744/";
const pageSize = 25;
const maxPages = 4;

export function singHealthResearchPage(html: string, expectedPage: number, currentDate: string) {
  const label = html.match(/aria-label="Search results for [^"]*Page (\d+) of (\d+), Results \d+ to \d+ of (\d+)"/i);
  const pages = Number(label?.[2]), total = Number(label?.[3]);
  const rows = [...html.matchAll(/<tr class="data-row">([\s\S]*?)<\/tr>/gi)];
  if (!label || Number(label[1]) !== expectedPage || pages < 1 || pages > maxPages || !rows.length) {
    throw new Error("SingHealth's official research listing or pagination could not be verified");
  }
  const ids: string[] = [];
  const records: OpportunityIngestionRecord[] = [];
  for (const [, row] of rows) {
    const link = row.match(/<a href="(\/[a-z0-9]+\/job\/[^"\s?#]+\/(\d+)\/)" class="jobTitle-link">([\s\S]*?)<\/a>/i);
    if (!link) throw new Error("A SingHealth vacancy had no official posting ID");
    ids.push(link[2]);
    const employer = htmlToText(row.match(/<span class="jobFacility">([\s\S]*?)<\/span>/i)?.[1]);
    const published = htmlToText(row.match(/<span class="jobDate">([\s\S]*?)<\/span>/i)?.[1]);
    const publishedAt = published ? englishDate(published) : null;
    if (!employer || !publishedAt || publishedAt > currentDate) continue;
    const sourceUrl = new URL(link[1], homepage).href;
    const record = toPositionRecord({
      sourceRecordId: link[2], sourceUrl, applicationUrl: sourceUrl, title: htmlToText(link[3]),
      organization: { name: employer, type: /hospital/i.test(employer) ? "HOSPITAL" : "RESEARCH_INSTITUTE", countryCode: "SG", website: "https://www.singhealth.com.sg/" },
      countryCode: "SG", city: "Singapore", publishedAt, biomedicalPublisher: true, requireResearchTitle: true,
    });
    if (record) records.push(record);
  }
  return { ids, pages, records, total };
}

export const singHealthResearchSource: OpportunitySourceConnector = {
  id: "singhealth-hospital-research-careers",
  source: { type: "INSTITUTIONAL_CAREERS", name: "SingHealth Research Careers", verified: true },
  kind: "positions", homepage,
  description: "Research appointments from SingHealth hospitals, the National Cancer Centre and the National Neuroscience Institute.",
  completeSnapshot: true, staleGraceHours: 24, intervalMinutes: 360, isEnabled: () => true,
  async collect({ fetch, now }) {
    const read = await openPublisher(fetch, homepage);
    const date = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Singapore" }).format(now);
    const first = singHealthResearchPage(await read(homepage), 1, date);
    const records = [...first.records];
    const ids = new Set(first.ids);
    for (let page = 2; page <= first.pages; page++) {
      const next = singHealthResearchPage(await read(homepage + (page - 1) * pageSize + "/"), page, date);
      if (next.pages !== first.pages || next.total !== first.total) throw new Error("SingHealth vacancies changed during pagination");
      for (const id of next.ids) ids.add(id);
      records.push(...next.records);
    }
    if (ids.size !== first.total) throw new Error("A complete SingHealth research snapshot could not be verified");
    return records;
  },
};
