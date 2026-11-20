import type { OpportunityIngestionRecord } from "../ingestion";
import { englishDate, openPublisher } from "./official-pages";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://eithealth.eu/opportunity/innovation-validation/";

export function eitHealthValidationRecords(html: string, now: Date): OpportunityIngestionRecord[] {
  const text = htmlToText(html);
  const window = text.match(/Call opens on:\s*(\d{1,2} \w+ 20\d{2})\s*Call closes on:\s*(\d{1,2} \w+ 20\d{2})/i);
  const opens = window && englishDate(window[1]);
  const deadline = window && englishDate(window[2]);
  if (!/Innovation Validation Call/i.test(text) || !opens || !deadline || opens >= deadline) {
    throw new Error("EIT Health's Innovation Validation call and dates were not recognized");
  }
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Brussels", dateStyle: "short" }).format(now);
  if (today < opens || today > deadline || /closed for applications/i.test(htmlToText(html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0]))) return [];
  const year = deadline.slice(0, 4);
  return [{
    sourceRecordId: `innovation-validation-${year}`,
    sourceUrl: homepage,
    applicationUrl: homepage,
    type: "GRANT",
    title: `EIT Health Innovation Validation Call ${year}`,
    description: "Funding for eligible consortia to validate late-stage digital, data and AI healthcare innovations. Review the official call for participating organisations and funding rules.",
    organization: { name: "EIT Health", type: "FOUNDATION", website: "https://eithealth.eu" },
    deadline,
    deadlineTimezone: "Europe/Brussels",
    topicSlugs: ["health-informatics", "biomedical-engineering"],
    metadata: { status: "open", fundingRegion: "Europe", openingDate: opens },
  }];
}

export const eitHealthValidationSource: OpportunitySourceConnector = {
  id: "eit-health-innovation-validation",
  source: { type: "FUNDER", name: "EIT Health Calls", verified: true },
  kind: "grants",
  homepage,
  description: "EIT Health's official Innovation Validation funding call for eligible healthcare consortia.",
  completeSnapshot: true,
  intervalMinutes: 360,
  isEnabled: () => true,
  async collect({ fetch, now }) {
    const page = await openPublisher(fetch, homepage);
    return eitHealthValidationRecords(await page(homepage), now);
  },
};
