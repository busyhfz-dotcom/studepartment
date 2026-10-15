import type { OpportunityIngestionRecord } from "../ingestion";
import { countryCodeFromText } from "./classify";
import { requestText } from "./http";
import { deadlineFromText, toPositionRecord } from "./positions";
import { parseFeed, type FeedItem } from "./rss";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const FEED_URL = "https://www.mpg.de/feeds/jobs.rss";

/** "The Max Planck Institute for Molecular Biomedicine is…" → "Max Planck Institute for Molecular Biomedicine". */
export function maxPlanckInstitute(text: string): string | null {
  const match = text.match(/\b(Max[- ]Planck[- ](?:Institute|Institut|Center|Centre|Research Group|Florida Institute)[\w\s'’&,-]{0,80}?)(?=\s*(?:\(|,|\.|;| is | in | seeks| invites| has | at |$))/);
  return match ? match[1].replace(/\s+/g, " ").replace(/[\s,]+$/, "").trim() : null;
}

export function toMaxPlanckRecord(item: FeedItem, now: Date): OpportunityIngestionRecord | null {
  const text = htmlToText(item.description || item.content);
  const institute = maxPlanckInstitute(text);
  const countryCode = countryCodeFromText(text.match(/\b(?:based in|located in|in) ([A-Z][\w-]+(?:,? [A-Z][\w-]+)?)/)?.[1]) ?? "DE";
  return toPositionRecord({
    sourceRecordId: item.guid || item.link,
    sourceUrl: item.link,
    applicationUrl: item.link,
    title: item.title,
    descriptionHtml: item.description || item.content,
    organization: {
      name: institute ?? "Max Planck Society",
      type: "RESEARCH_INSTITUTE",
      countryCode,
      website: "https://www.mpg.de",
    },
    countryCode,
    deadline: deadlineFromText(text, now),
    publishedAt: item.publishedAt,
    subjects: item.categories,
  });
}

export const maxPlanckSource: OpportunitySourceConnector = {
  id: "max-planck",
  source: { type: "INSTITUTIONAL_CAREERS", name: "Max Planck Society job board", verified: true },
  kind: "positions",
  homepage: "https://www.mpg.de/jobboard",
  description: "PhD, postdoc and research positions in the life and medical sciences at the Max Planck institutes, from the Society's own job feed.",
  completeSnapshot: false,
  intervalMinutes: 60,
  isEnabled: () => true,
  async collect(context) {
    const xml = await requestText(context.fetch, FEED_URL);
    const items = parseFeed(xml);
    const records = items
      .map((item) => toMaxPlanckRecord(item, context.now))
      .filter((record): record is OpportunityIngestionRecord => Boolean(record));
    context.log(`Max Planck: ${records.length} biomedical research positions of ${items.length} in the feed`);
    return records;
  },
};
