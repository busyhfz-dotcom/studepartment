import type { OpportunityIngestionRecord } from "../ingestion";
import { englishDate, openPublisher } from "./official-pages";
import { toPositionRecord } from "./positions";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://euraxess.ec.europa.eu/jobs/search";
const LISTING = /<article class="ecl-content-item">([\s\S]*?)<\/article>/g;

export function euraxessRecords(html: string, now: Date): OpportunityIngestionRecord[] {
  const cards = Array.from(html.matchAll(LISTING));
  if (!cards.length) throw new Error("EURAXESS's public job list was not recognized");
  const today = now.toISOString().slice(0, 10);
  return cards.flatMap(([, card]) => {
    const titleLink = card.match(/<h3\b[^>]*>\s*<a\s+href="(\/jobs\/(\d+))"[^>]*>([\s\S]*?)<\/a>/i);
    if (!titleLink) return [];
    const [, path, id, markup] = titleLink;
    const title = htmlToText(markup).replace(/\bPost-Doctorate\b/i, "Postdoctoral position");
    const employer = htmlToText(card.match(/<li class="ecl-content-block__primary-meta-item">([\s\S]*?)<\/li>/)?.[1]);
    const teaser = htmlToText(card.match(/<div class="ecl-content-block__description">([\s\S]*?)<\/div>/)?.[1]);
    const details = htmlToText(card);
    const publishedText = details.match(/Posted on:\s*(\d{1,2} [A-Z][a-z]+ 20\d{2})/i)?.[1];
    const publishedAt = publishedText ? englishDate(publishedText) : null;
    const closing = details.match(/Application Deadline:\s*(\d{1,2} [A-Z][a-z]+ 20\d{2})\s*-\s*(\d\d:\d\d)\s*\(([^)]+)\)/i);
    const deadline = closing ? englishDate(closing[1]) : null;
    if (!employer || !publishedAt || publishedAt > today || !deadline || deadline < today) return [];
    const location = details.match(/Work Locations?:\s*Number of offers:\s*\d+,\s*([^,]+),/i)?.[1];
    const field = details.match(/Research Field:\s*(.*?)\s*Researcher Profile:/i)?.[1];
    const sourceUrl = new URL(path, homepage).href;
    const record = toPositionRecord({
      sourceRecordId: id,
      sourceUrl,
      applicationUrl: sourceUrl,
      title,
      descriptionHtml: teaser,
      organization: { name: employer, type: "RESEARCH_INSTITUTE" },
      location,
      subjects: field ? [field] : [],
      deadline: closing?.[3] === "UTC" ? `${deadline}T${closing[2]}:00Z` : deadline,
      publishedAt,
    });
    if (!record) return [];
    const scholarship = /^\s*(?:ph\.?\s?d|doctoral)\s+(?:scholarship|studentship)\b/i.test(title);
    return [{
      ...record,
      type: scholarship ? "PHD_SCHOLARSHIP" : record.type,
      title: htmlToText(markup),
      description: null, // The employer owns its text; display basic facts and link to the original ad.
      deadlineTimezone: closing?.[3],
    }];
  });
}

export const euraxessSource: OpportunitySourceConnector = {
  id: "euraxess-recent-research-jobs",
  source: { type: "RESEARCH_NETWORK", name: "EURAXESS – employer listings", verified: true },
  kind: "positions",
  homepage,
  description: "Recent research opportunities posted by employers on the European Commission’s EURAXESS portal, linked to the original advert.",
  completeSnapshot: false,
  intervalMinutes: 60,
  isEnabled: () => true,
  async collect({ fetch, now }) {
    const page = await openPublisher(fetch, homepage);
    return euraxessRecords(await page(homepage), now);
  },
};
