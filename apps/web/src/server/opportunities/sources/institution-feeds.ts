import type { OpportunityIngestionRecord } from "../ingestion";
import { isMedicalText } from "./classify";
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
  focused?: boolean;
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
  { id: "cambridge", name: "University of Cambridge", feedUrl: "https://www.jobs.cam.ac.uk/job/?format=rss", homepage: "https://www.jobs.cam.ac.uk", website: "https://www.cam.ac.uk", countryCode: "GB", city: "Cambridge", type: "UNIVERSITY" },
  { id: "leeds", name: "University of Leeds", feedUrl: "https://jobs.leeds.ac.uk/rss/rss.aspx", homepage: "https://jobs.leeds.ac.uk", website: "https://www.leeds.ac.uk", countryCode: "GB", city: "Leeds", type: "UNIVERSITY" },
  { id: "karolinska", name: "Karolinska Institutet", feedUrl: "https://ki.varbi.com/en/what:rssfeed", homepage: "https://ki.varbi.com/en/", website: "https://ki.se", countryCode: "SE", city: "Stockholm", type: "UNIVERSITY" },
  { id: "lund", name: "Lund University", feedUrl: "https://lu.varbi.com/en/what:rssfeed", homepage: "https://lu.varbi.com/en/", website: "https://www.lunduniversity.lu.se", countryCode: "SE", city: "Lund", type: "UNIVERSITY" },
  { id: "uppsala", name: "Uppsala University", feedUrl: "https://uu.varbi.com/en/what:rssfeed", homepage: "https://uu.varbi.com/en/", website: "https://www.uu.se", countryCode: "SE", city: "Uppsala", type: "UNIVERSITY" },
  { id: "bath", name: "University of Bath", feedUrl: "https://www.bath.ac.uk/jobs/rss/rss.aspx", homepage: "https://www.bath.ac.uk/jobs/", website: "https://www.bath.ac.uk", countryCode: "GB", city: "Bath", type: "UNIVERSITY", focused: true },
  { id: "brighton", name: "University of Brighton", feedUrl: "https://jobs.brighton.ac.uk/rss/rss.aspx", homepage: "https://jobs.brighton.ac.uk", website: "https://www.brighton.ac.uk", countryCode: "GB", city: "Brighton", type: "UNIVERSITY", focused: true },
  { id: "southampton", name: "University of Southampton", feedUrl: "https://jobs.soton.ac.uk/rss/rss.aspx", homepage: "https://jobs.soton.ac.uk", website: "https://www.southampton.ac.uk", countryCode: "GB", city: "Southampton", type: "UNIVERSITY", focused: true },
  { id: "surrey", name: "University of Surrey", feedUrl: "https://jobs.surrey.ac.uk/rss/rss.aspx", homepage: "https://jobs.surrey.ac.uk", website: "https://www.surrey.ac.uk", countryCode: "GB", city: "Guildford", type: "UNIVERSITY", focused: true },
  { id: "umea-medical", name: "Umeå University", feedUrl: "https://umu.varbi.com/en/what:rssfeed", homepage: "https://umu.varbi.com/en/", website: "https://www.umu.se", countryCode: "SE", city: "Umeå", type: "UNIVERSITY", focused: true },
  { id: "stockholm-health", name: "Stockholm University", feedUrl: "https://su.varbi.com/en/what:rssfeed", homepage: "https://su.varbi.com/en/", website: "https://www.su.se", countryCode: "SE", city: "Stockholm", type: "UNIVERSITY", focused: true },
  { id: "aston-health", name: "Aston University", feedUrl: "https://jobs.aston.ac.uk/rss/rss.aspx", homepage: "https://jobs.aston.ac.uk/", website: "https://www.aston.ac.uk", countryCode: "GB", city: "Birmingham", type: "UNIVERSITY", focused: true },
  { id: "kth-biomedical", name: "KTH Royal Institute of Technology", feedUrl: "https://kth.varbi.com/en/what:rssfeed", homepage: "https://kth.varbi.com/en/", website: "https://www.kth.se", countryCode: "SE", city: "Stockholm", type: "UNIVERSITY", focused: true },
  { id: "region-stockholm-research", name: "Region Stockholm", feedUrl: "https://regionstockholm.varbi.com/en/what:rssfeed", homepage: "https://regionstockholm.varbi.com/en/", website: "https://www.regionstockholm.se", countryCode: "SE", city: "Stockholm", type: "HOSPITAL", focused: true },
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
  const swedishHealth = feed.countryCode === "SE"
    && /(?:medicin(?:sk[at]?)?|hälsa|folkhäls|onkolog|sjukvård|sjuksköterska|biomedicin|diabetes|neuro|immunologi|epidemiologi)/iu.test(item.title + " " + text.slice(0, 220));
  if (feed.focused && /\b(?:delivery manager|marine ecosystem|quantum-inspired computing|teaching technician)\b/i.test(item.title)) return null;
  if (feed.focused && !fromMedicalSchool && !swedishHealth && !isMedicalText(item.title, item.categories?.join(" "), text.slice(0, 220))) return null;
  const localDeadline = text.match(/Sista ansökningsdag\s*:?\s*(20\d{2}-\d{2}-\d{2})/iu)?.[1];
  const record = toPositionRecord({
    sourceRecordId: item.guid || item.link,
    sourceUrl: item.link,
    applicationUrl: item.link,
    title: stripReference(item.title),
    descriptionHtml: item.description || item.content,
    organization: { name: feed.name, type: feed.type, countryCode: feed.countryCode, website: feed.website },
    city: feed.city,
    countryCode: feed.countryCode,
    deadline: deadlineFromText(text, now) ?? localDeadline,
    publishedAt: item.publishedAt,
    subjects: item.categories,
    biomedicalPublisher: fromMedicalSchool || swedishHealth,
  });
  if (record?.type === "PHD" && /\bfunded\s+(?:ph\.?d|doctoral)\b|\bstipend\s+(?:of|is|at)\b|\b(?:funding|scholarship) covers (?:tuition|fees)\b/i.test(item.title + " " + text)
    && !/\b(?:unfunded|self[- ]funded|seeking funding|funding is not guaranteed)\b/i.test(item.title + " " + text)) {
    record.type = "PHD_SCHOLARSHIP";
  }
  return record && feed.focused ? { ...record, description: null } : record;
}

export const institutionFeedSources: OpportunitySourceConnector[] = INSTITUTION_FEEDS.map((feed) => ({
  id: `feed-${feed.id}`,
  source: { type: "INSTITUTIONAL_CAREERS", name: `${feed.name} jobs`, verified: true },
  kind: "positions",
  homepage: feed.homepage,
  description: `Biomedical PhD, postdoc and research posts from ${feed.name}'s official vacancy feed.`,
  completeSnapshot: true,
  intervalMinutes: feed.focused ? 360 : 60,
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
