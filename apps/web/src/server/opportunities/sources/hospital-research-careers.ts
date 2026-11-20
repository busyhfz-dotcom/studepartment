import type { OpportunityIngestionRecord } from "../ingestion";
import { englishDate, openPublisher } from "./official-pages";
import { toPositionRecord } from "./positions";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const ottawa = "https://ohri.ca/en/join-us/career-opportunities";
const hopkins = "https://jobs.hopkinsmedicine.org/jobs/clinical-research/";
const msk = "https://careers.mskcc.org/search-jobs/?Keyword=research";

export function ottawaResearchRecords(html: string, today: string): OpportunityIngestionRecord[] {
  const cards = [...html.matchAll(/<article class="c84-job-posting\b[^"]*">([\s\S]*?)<\/article>/gi)];
  if (!cards.length || !/Career Opportunities \| Ottawa Hospital Research Institute/i.test(html)) {
    throw new Error("Ottawa Hospital Research Institute's vacancy list was not recognized");
  }
  return cards.flatMap(([, card]) => {
    const link = card.match(/<h4[^>]*>\s*<a href="(https:\/\/ohri\.ca\/en\/join-us\/career-opportunities\/([a-z0-9-]+))"[^>]*>([\s\S]*?)<\/a>/i);
    const deadlineText = htmlToText(card.match(/Submission deadline:\s*([^<]+)/i)?.[1]);
    const deadline = deadlineText ? englishDate(deadlineText) : null;
    if (!link || !deadline || deadline < today) return [];
    const record = toPositionRecord({
      sourceRecordId: link[2], sourceUrl: link[1], applicationUrl: link[1], title: htmlToText(link[3]),
      organization: { name: "Ottawa Hospital Research Institute", type: "RESEARCH_INSTITUTE", website: "https://ohri.ca/", countryCode: "CA" },
      countryCode: "CA", city: "Ottawa", deadline, biomedicalPublisher: true,
    });
    return record ? [{ ...record, deadlineTimezone: "America/Toronto" }] : [];
  });
}

export function hopkinsResearchRecords(html: string): OpportunityIngestionRecord[] {
  const cards = [...html.matchAll(/<a href="(\/job\/(\d+)\/[a-z0-9-]+\/)">\s*<h3>([\s\S]*?)<\/h3>[\s\S]*?<span class="location">[\s\S]*?<dd>([\s\S]*?)<\/dd>[\s\S]*?<span class="description">([\s\S]*?)<\/span>/gi)];
  if (!/Clinical Research Jobs at <span>Johns Hopkins Medicine/i.test(html) || !cards.length) {
    throw new Error("Johns Hopkins Medicine's clinical research vacancies were not recognized");
  }
  return cards.flatMap(([, path, id, title, location, description]) => {
    const sourceUrl = new URL(path, hopkins).href;
    const record = toPositionRecord({
      sourceRecordId: id, sourceUrl, applicationUrl: sourceUrl, title: htmlToText(title),
      organization: { name: "Johns Hopkins Medicine", type: "HOSPITAL", website: "https://www.hopkinsmedicine.org/", countryCode: "US" },
      countryCode: "US", city: htmlToText(location).split(",").at(-2)?.trim(), descriptionHtml: description,
      biomedicalPublisher: true, requireResearchTitle: true,
    });
    return record ? [{ ...record, description: null }] : [];
  });
}

export function mskResearchRecords(html: string, today: string): OpportunityIngestionRecord[] {
  const cards = [...html.matchAll(/<div class="job-results-item pb-sm-5 mb-5"[^>]*>([\s\S]*?)(?=<div class="job-results-item pb-sm-5 mb-5"|<\/section>)/gi)];
  if (!/MSK Careers/i.test(html) || !cards.length) throw new Error("Memorial Sloan Kettering's research vacancies were not recognized");
  return cards.flatMap(([, card]) => {
    const link = card.match(/<h2[^>]+itemprop="title">\s*<a[^>]+href="(\/vacancies\/(\d+)-[a-z0-9-]+\/)"[^>]*>([\s\S]*?)<\/a>/i);
    const publishedAt = card.match(/itemprop="datePosted">(20\d{2}-\d{2}-\d{2})</i)?.[1];
    if (!link || !publishedAt || publishedAt > today) return [];
    const city = htmlToText(card.match(/itemprop="addressLocality">([\s\S]*?)<\/span>/i)?.[1]);
    const sourceUrl = new URL(link[1], msk).href;
    const record = toPositionRecord({
      sourceRecordId: link[2], sourceUrl, applicationUrl: sourceUrl, title: htmlToText(link[3]),
      organization: { name: "Memorial Sloan Kettering Cancer Center", type: "HOSPITAL", website: "https://www.mskcc.org/", countryCode: "US" },
      countryCode: "US", city: city || undefined, publishedAt, biomedicalPublisher: true, requireResearchTitle: true,
    });
    return record ? [record] : [];
  });
}

export const hospitalResearchSources: OpportunitySourceConnector[] = [
  {
    id: "ottawa-hospital-research-careers",
    source: { type: "INSTITUTIONAL_CAREERS", name: "Ottawa Hospital Research Institute Careers", verified: true },
    kind: "positions",
    homepage: ottawa,
    description: "Dated openings from Ottawa Hospital Research Institute's official recruitment listings.",
    completeSnapshot: true,
    staleGraceHours: 24,
    intervalMinutes: 360,
    isEnabled: () => true,
    async collect({ fetch, now }) {
      const read = await openPublisher(fetch, ottawa);
      return ottawaResearchRecords(await read(ottawa), new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Toronto" }).format(now));
    },
  },
  {
    id: "johns-hopkins-medicine-clinical-research",
    source: { type: "INSTITUTIONAL_CAREERS", name: "Johns Hopkins Medicine Clinical Research", verified: true },
    kind: "positions",
    homepage: hopkins,
    description: "Clinical research jobs with Johns Hopkins Medicine hospitals and institutes.",
    completeSnapshot: false,
    intervalMinutes: 360,
    isEnabled: () => true,
    async collect({ fetch }) {
      const read = await openPublisher(fetch, hopkins);
      return hopkinsResearchRecords(await read(hopkins));
    },
  },
  {
    id: "msk-cancer-research-careers",
    source: { type: "INSTITUTIONAL_CAREERS", name: "Memorial Sloan Kettering Cancer Center Research Careers", verified: true },
    kind: "positions",
    homepage: msk,
    description: "Research appointments from the official Memorial Sloan Kettering Cancer Center careers site.",
    completeSnapshot: false,
    intervalMinutes: 360,
    isEnabled: () => true,
    async collect({ fetch, now }) {
      const read = await openPublisher(fetch, msk);
      return mskResearchRecords(await read(msk), new Intl.DateTimeFormat("sv-SE", { timeZone: "America/New_York" }).format(now));
    },
  },
];
