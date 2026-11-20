import type { OpportunityIngestionRecord } from "../ingestion";
import { englishDate, openPublisher } from "./official-pages";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://www.neurological.org.nz/apply-for-funding/";
const organization = { name: "Neurological Foundation of New Zealand", type: "FOUNDATION", countryCode: "NZ", website: "https://www.neurological.org.nz/" } as const;

export function neurologicalFoundationRecords(html: string, today: string): OpportunityIngestionRecord[] {
  const cards = Array.from(html.matchAll(/<li class="link-wrapper" id="grant-\d+">([\s\S]*?)<\/li>/gi));
  if (!/Apply for funding\s*\|\s*Neurological Foundation/i.test(html) || !cards.length) {
    throw new Error("The Neurological Foundation's grant catalogue was not recognized");
  }
  return cards.flatMap(([, card]) => {
    const title = htmlToText(card.match(/<h3 class="title">([\s\S]*?)<\/h3>/i)?.[1]);
    // Exclude invitation-only full proposals, fellowships and degree awards from this grant feed.
    if (!/\bgrant$/i.test(title)) return [];
    const sourceUrl = card.match(/href="(https:\/\/grants\.neurological\.org\.nz\/grants\/[a-z0-9-]+)"/i)?.[1];
    const description = htmlToText(card.match(/<p class="text">([\s\S]*?)<\/p>/i)?.[1]);
    const date = description.match(/\bApplications are due (\d{1,2} [A-Za-z]+ 20\d{2})\b/i)?.[1];
    const deadline = date ? englishDate(date) : null;
    if (!sourceUrl || !deadline || deadline < today) return [];
    return [{
      sourceRecordId: sourceUrl.slice(sourceUrl.lastIndexOf("/") + 1),
      sourceUrl,
      applicationUrl: sourceUrl,
      type: "GRANT",
      title,
      organization,
      countryCode: "NZ",
      deadline,
      deadlineTimezone: "Pacific/Auckland",
      topicSlugs: ["neuroscience"],
      metadata: { fundingRegion: "New Zealand" },
    }];
  });
}

export const neurologicalFoundationSource: OpportunitySourceConnector = {
  id: "neurological-foundation-nz-grants",
  source: { type: "FUNDER", name: "Neurological Foundation of New Zealand", verified: true },
  kind: "grants",
  homepage,
  description: "Dated research grants published by the Neurological Foundation of New Zealand.",
  completeSnapshot: false,
  intervalMinutes: 360,
  isEnabled: () => true,
  async collect({ fetch, now }) {
    const read = await openPublisher(fetch, homepage);
    return neurologicalFoundationRecords(await read(homepage), new Intl.DateTimeFormat("sv-SE", { timeZone: "Pacific/Auckland" }).format(now));
  },
};
