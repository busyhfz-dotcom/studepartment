import { setTimeout as delay } from "node:timers/promises";
import type { OpportunityIngestionRecord } from "../ingestion";
import { englishDate, openPublisher } from "./official-pages";
import { toPositionRecord } from "./positions";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://jobs.hku.hk/en/jobs/search";
const maxPages = 4;
const crawlDelayMs = 5_000;

export function hkuResearchPage(html: string, today: string) {
  const cards = Array.from(html.matchAll(/<article class="col-12 job-search-results-card-col"[^>]*>([\s\S]*?)<\/article>/gi));
  if (!/The University of Hong Kong \(HKU\) Careers/i.test(html) || !cards.length) {
    throw new Error("HKU's public vacancies were not recognized");
  }
  const records = cards.flatMap(([, card]): OpportunityIngestionRecord[] => {
    const job = card.match(/<a id="link_job_title_[^"]+" href="(https:\/\/jobs\.hku\.hk\/jobs\/[a-z0-9-]+)">([\s\S]*?)<\/a>/i);
    const id = card.match(/<span id="requisition_identifier_icon_text_[^"]+">\s*(\d+)\s*<\/span>/i)?.[1];
    const dateText = card.match(/Closing on:\s*([A-Za-z]+ \d{1,2},? 20\d{2})/i)?.[1];
    const deadline = dateText ? englishDate(dateText) : null;
    if (!job || !id || !deadline || deadline < today) return [];
    const department = htmlToText(card.match(/<span id="department_icon_text_[^"]+">([\s\S]*?)<\/span>/i)?.[1]);
    const faculty = htmlToText(card.match(/<span id="dropdown_field_1_icon_text_[^"]+">([\s\S]*?)<\/span>/i)?.[1]);
    const record = toPositionRecord({
      sourceRecordId: id,
      sourceUrl: job[1],
      applicationUrl: job[1],
      title: htmlToText(job[2]),
      organization: { name: "The University of Hong Kong", type: "UNIVERSITY", countryCode: "HK", website: "https://www.hku.hk/" },
      countryCode: "HK",
      location: "Hong Kong",
      deadline,
      subjects: [department, faculty],
      requireResearchTitle: true,
    });
    return record ? [{ ...record, deadlineTimezone: "Asia/Hong_Kong" }] : [];
  });
  return { records, next: /<a rel="next" class="page-link"/i.test(html) };
}

export const hkuResearchCareersSource: OpportunitySourceConnector = {
  id: "hku-health-research",
  source: { type: "INSTITUTIONAL_CAREERS", name: "University of Hong Kong Research Careers", verified: true },
  kind: "positions",
  homepage,
  description: "Biomedical and health research vacancies with published deadlines on HKU's careers board.",
  completeSnapshot: false,
  intervalMinutes: 360,
  isEnabled: () => true,
  async collect({ fetch, now }) {
    const read = await openPublisher(fetch, homepage);
    const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Hong_Kong" }).format(now);
    const records = [];
    for (let page = 1; page <= maxPages; page++) {
      await delay(crawlDelayMs);
      const result = hkuResearchPage(await read(page === 1 ? homepage : homepage + "?page=" + page), today);
      records.push(...result.records);
      if (!result.next) break;
    }
    return records;
  },
};
