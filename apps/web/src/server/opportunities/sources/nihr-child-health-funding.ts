import type { OpportunityIngestionRecord } from "../ingestion";
import { topicSlugsFor } from "./classify";
import { englishDate, openPublisher } from "./official-pages";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://hrc-children.nihr.ac.uk/funding-calls/";
const nihr = "National Institute for Health and Care Research";

function amount(value: string) {
  const match = value.match(/^£\s*([\d,.]+)(?:\s+(million))?$/i);
  return match ? Number(match[1].replaceAll(",", "")) * (match[2] ? 1_000_000 : 1) : undefined;
}

export function nihrChildHealthRecords(html: string, now: Date): OpportunityIngestionRecord[] {
  if (!/Closing Date:/i.test(html) || !/Funding Calls/i.test(html)) throw new Error("NIHR's funding calendar was not recognized");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(now);
  const headings = [...html.matchAll(/<p>\s*<strong>([^<]{6,230})<\/strong>\s*<\/p>/gi)];
  return headings.flatMap((heading, index) => {
    const section = html.slice((heading.index ?? 0) + heading[0].length, headings[index + 1]?.index);
    const detail = section.match(/href=['"](https:\/\/www\.nihr\.ac\.uk\/funding\/[\w-]+\/([\d-]+)\/?)(?:\?[^'"]*)?['"]/i);
    const closing = /<strong>Closing Date:\s*<\/strong>\s*(\d{1,2}\s+[A-Za-z]+\s+20\d{2})/i.exec(section)?.[1];
    const funder = /<strong>Funder:\s*<\/strong>([\s\S]{1,300}?)<\/p>/i.exec(section)?.[1];
    const deadline = closing ? englishDate(closing) : null;
    const title = htmlToText(heading[1]);
    if (!detail || !funder || !htmlToText(funder).includes(nihr) || !deadline || deadline < today || !title) return [];
    const award = htmlToText(/<strong>Maximum Amount:\s*<\/strong>([\s\S]{1,70}?)<\/p>/i.exec(section)?.[1]);
    return [{
      sourceRecordId: detail[2], sourceUrl: detail[1], applicationUrl: detail[1],
      title, deadline, deadlineTimezone: "Europe/London",
      type: /\b(?:fellowship|studentship)\b/i.test(title) ? "FELLOWSHIP" : "GRANT",
      organization: { name: nihr, type: "FOUNDATION", website: "https://www.nihr.ac.uk", countryCode: "GB" },
      countryCode: "GB", status: "ACTIVE",
      topicSlugs: topicSlugsFor(title),
      metadata: { awardMax: amount(award), awardCurrency: "GBP", fundingRegion: "United Kingdom" },
    }];
  });
}

export const nihrChildHealthSource: OpportunitySourceConnector = {
  id: "nihr-child-health-funding",
  source: { type: "FUNDER", name: "NIHR HealthTech Research Centre funding calendar", verified: true },
  kind: "grants", homepage,
  description: "NIHR application calls with dates and links to the funder's announcement.",
  completeSnapshot: false, intervalMinutes: 360,
  isEnabled: () => true,
  async collect({ fetch, now }) {
    const read = await openPublisher(fetch, homepage);
    return nihrChildHealthRecords(await read(homepage), now);
  },
};
