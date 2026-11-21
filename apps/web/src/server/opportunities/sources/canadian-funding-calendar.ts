import type { OpportunityIngestionRecord } from "../ingestion";
import { isMedicalText, topicSlugsFor } from "./classify";
import { openPublisher } from "./official-pages";
import { decodeEntities, htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://www.canada.ca/en/research-coordinating-committee/program-calendar.html";
const timeZone = "America/Toronto";
const organizations = {
  CIHR: { name: "Canadian Institutes of Health Research", type: "FOUNDATION" as const, countryCode: "CA", website: "https://cihr-irsc.gc.ca" },
  NSERC: { name: "Natural Sciences and Engineering Research Council of Canada", type: "FOUNDATION" as const, countryCode: "CA", website: "https://nserc-crsng.canada.ca" },
};

function awardType(title: string): OpportunityIngestionRecord["type"] | null {
  if (/\b(?:scholarship|award)s?\b/i.test(title) && /\bmaster['’]s\b/i.test(title)) return "MASTERS_SCHOLARSHIP";
  if (/\b(?:scholarship|award)s?\b/i.test(title) && /\b(?:doctoral|doctorate)\b/i.test(title)) return "PHD_SCHOLARSHIP";
  if (/\bfellowships?\b/i.test(title)) return "FELLOWSHIP";
  return /\bgrants?\b/i.test(title) ? "GRANT" : null;
}

export function canadianFundingCalendarRecords(html: string, now: Date): OpportunityIngestionRecord[] {
  const table = html.match(/<table[^>]+id="dataset-filter"[^>]*>([\s\S]*?)<\/table>/i)?.[1];
  if (!table) throw new Error("Canada's integrated funding calendar was not recognized");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
  return [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].flatMap(([, row]) => {
    const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(([, cell]) => cell);
    if (cells.length !== 4) return [];
    const agencies = htmlToText(cells[0]).split(/,\s*/);
    const link = cells[1].match(/<a\b[^>]*href="(https:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!link) return [];
    const title = htmlToText(link[2]).replace(/\s+:/g, ":");
    const type = awardType(title);
    const deadline = htmlToText(cells[3]).match(/\b20\d{2}-\d{2}-\d{2}\b/g)?.filter(day => day >= today).sort()[0];
    if (!type || !deadline || (!agencies.includes("CIHR") && !(agencies.includes("NSERC") && isMedicalText(title)))) return [];
    const organization = agencies.includes("CIHR") ? organizations.CIHR : organizations.NSERC;
    const url = new URL(decodeEntities(link[1]));
    const programme = url.searchParams.get("prog");
    if (url.hostname === "www.researchnet-recherchenet.ca" && programme && /^\d+$/.test(programme)) {
      url.search = new URLSearchParams({ prog: programme, language: "E" }).toString();
    }
    const registration = htmlToText(cells[2]);
    const hasRegistration = /^20\d{2}-\d{2}-\d{2}$/.test(registration);
    return [{
      sourceRecordId: url.href,
      sourceUrl: url.href,
      applicationUrl: url.href,
      type,
      title,
      description: hasRegistration
        ? `The federal funding calendar gives ${registration} as the letter-of-intent deadline. Confirm current dates and eligibility on the official opportunity page.`
        : "The federal funding calendar lists this opportunity. Confirm current dates and eligibility on the official programme page.",
      organization,
      countryCode: "CA",
      deadline,
      deadlineTimezone: timeZone,
      topicSlugs: topicSlugsFor(title),
      status: "ACTIVE",
      metadata: { fundingRegion: "Canada", registrationDeadline: hasRegistration ? registration : null },
    }];
  });
}

export const canadianFundingCalendarSource: OpportunitySourceConnector = {
  id: "canada-integrated-health-funding",
  source: { type: "FUNDER", name: "Canada integrated research funding calendar", verified: true },
  kind: "grants",
  homepage,
  description: "Dated health research grants, fellowships and graduate scholarships from Canada's official integrated funding calendar.",
  completeSnapshot: true,
  allowEmptySnapshot: true,
  intervalMinutes: 720,
  staleGraceHours: 24,
  isEnabled: () => true,
  async collect({ fetch, now, log }) {
    const read = await openPublisher(fetch, homepage);
    const records = canadianFundingCalendarRecords(await read(homepage), now);
    log(`Canada integrated funding calendar: ${records.length} dated health funding opportunities`);
    return records;
  },
};
