import type { OpportunityIngestionRecord } from "../ingestion";
import { openPublisher } from "./official-pages";
import { toPositionRecord } from "./positions";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://apply.jobs.scot.nhs.uk";
const researchSearch = "/Home/_JobCard?what=Research";

function field(html: string, key: string) {
  return htmlToText(html.match(new RegExp(`<p class="jobdetailsitem ${key}">\\s*<strong>[^<]*<\\/strong>([\\s\\S]*?)<\\/p>`, "i"))?.[1]);
}

function date(value: string) {
  const parts = value.match(/^(\d{2})\/(\d{2})\/(20\d{2})$/);
  return parts ? `${parts[3]}-${parts[2]}-${parts[1]}` : null;
}

export function nhsScotlandResearchRecords(html: string, now: Date): OpportunityIngestionRecord[] {
  const adverts = [...html.matchAll(/<a\b[^>]*href="(\/Job\/JobDetail\?JobId=(\d+))"[^>]*data-testid="a-job-detail-[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)];
  if (!adverts.length && !/no (?:jobs|vacancies|results)|couldn[’']t find/i.test(html)) {
    throw new Error("NHS Scotland's advertised vacancies were not recognized");
  }
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(now);
  return adverts.flatMap(([, path, id, markup], index) => {
    const block = html.slice((adverts[index].index ?? 0) + adverts[index][0].length, adverts[index + 1]?.index);
    const employer = field(block, "school");
    const deadline = date(field(block, "closingdate"));
    const title = htmlToText(markup).replace(/^\d{4,8}\s*(?:\([^)]+\)\s*)?[-–]?\s*/, "");
    if (!employer || !deadline || deadline < today) return [];
    const sourceUrl = new URL(path, homepage).href;
    const record = toPositionRecord({
      sourceRecordId: id, sourceUrl, applicationUrl: sourceUrl, title, deadline, publishedAt: date(field(block, "livedate")),
      organization: { name: employer, type: "HOSPITAL", countryCode: "GB" },
      countryCode: "GB",
      city: field(block, "location").split(",").at(-1)?.trim(),
      subjects: [field(block, "shift")], biomedicalPublisher: true, requireResearchTitle: true,
    });
    return record ? [{ ...record, deadlineTimezone: "Europe/London" }] : [];
  });
}

export const nhsScotlandResearchSource: OpportunitySourceConnector = {
  id: "nhs-scotland-research",
  source: { type: "INSTITUTIONAL_CAREERS", name: "NHS Scotland Research Jobs", verified: true },
  homepage,
  kind: "positions",
  description: "Dated research vacancies from the official NHS Scotland recruitment portal.",
  completeSnapshot: false,
  intervalMinutes: 360,
  isEnabled: () => true,
  async collect({ fetch, now }) {
    const read = await openPublisher(fetch, homepage);
    return nhsScotlandResearchRecords(await read(researchSearch), now);
  },
};
