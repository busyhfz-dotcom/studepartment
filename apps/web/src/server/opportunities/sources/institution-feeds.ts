import type { OpportunityIngestionRecord } from "../ingestion";
import { requestText } from "./http";
import { deadlineFromText, toPositionRecord } from "./positions";
import { parseFeed, type FeedItem } from "./rss";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

type InstitutionFeed = {
  id: string;
  name: string;
  feedUrl: string;
  homepage: string;
  website: string;
  countryCode: string;
  city: string | null;
  type: OpportunityIngestionRecord["organization"]["type"];
};

/**
 * Universities and institutes that publish all of their vacancies as an
 * official RSS feed. Each feed is filtered to biomedical research posts.
 */
export const INSTITUTION_FEEDS: InstitutionFeed[] = [
  {
    id: "nottingham",
    name: "University of Nottingham",
    feedUrl: "https://jobs.nottingham.ac.uk/rss/rss.aspx",
    homepage: "https://jobs.nottingham.ac.uk",
    website: "https://www.nottingham.ac.uk",
    countryCode: "GB",
    city: "Nottingham",
    type: "UNIVERSITY",
  },
];

/** "Research Fellow (Fixed Term) (MED2602326)" → "Research Fellow (Fixed Term)". */
export function stripReference(title: string): string {
  return title.replace(/\s*\((?=[A-Z0-9-]*\d)[A-Z]{2,6}[\dA-Z-]{3,}\)\s*$/, "").trim();
}

export function toInstitutionFeedRecord(item: FeedItem, feed: InstitutionFeed, now: Date): OpportunityIngestionRecord | null {
  const text = htmlToText(item.description || item.content);
  // Vacancy references from medical schools start with MED at the UK
  // universities using this system; treat them as biomedical even when the
  // short description does not say so.
  const fromMedicalSchool = /\(MED[\dA-Z-]+\)\s*$/.test(item.title);
  return toPositionRecord({
    sourceRecordId: item.guid || item.link,
    sourceUrl: item.link,
    applicationUrl: item.link,
    title: stripReference(item.title),
    descriptionHtml: item.description || item.content,
    organization: { name: feed.name, type: feed.type, countryCode: feed.countryCode, website: feed.website },
    city: feed.city,
    countryCode: feed.countryCode,
    deadline: deadlineFromText(text, now),
    publishedAt: item.publishedAt,
    subjects: item.categories,
    biomedicalPublisher: fromMedicalSchool,
  });
}

export const institutionFeedSources: OpportunitySourceConnector[] = INSTITUTION_FEEDS.map((feed) => ({
  id: `feed-${feed.id}`,
  source: { type: "INSTITUTIONAL_CAREERS", name: `${feed.name} jobs`, verified: true },
  kind: "positions",
  homepage: feed.homepage,
  description: `Biomedical PhD, postdoc and research posts from ${feed.name}'s official vacancy feed.`,
  completeSnapshot: true,
  intervalMinutes: 60,
  isEnabled: () => true,
  async collect(context) {
    const items = parseFeed(await requestText(context.fetch, feed.feedUrl));
    const records = items
      .map((item) => toInstitutionFeedRecord(item, feed, context.now))
      .filter((record): record is OpportunityIngestionRecord => Boolean(record));
    context.log(`${feed.name}: ${records.length} biomedical research posts of ${items.length} vacancies`);
    return records;
  },
}));
