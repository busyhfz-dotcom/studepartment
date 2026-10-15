import type { OpportunityIngestionRecord } from "../ingestion";
import { careerStagesForPosition, classifyPositionTitle, countryCodeFromText, isMedicalText, methodSlugsFor, topicSlugsFor } from "./classify";
import { cleanDescription, decodeEntities } from "./text";

export type PositionInput = {
  sourceRecordId: string;
  sourceUrl: string;
  applicationUrl?: string | null;
  title: string;
  descriptionHtml?: string | null;
  organization: { name: string; type: OpportunityIngestionRecord["organization"]["type"]; countryCode?: string | null; website?: string | null };
  city?: string | null;
  countryCode?: string | null;
  location?: string | null;
  deadline?: string | null;
  publishedAt?: string | null;
  /** Extra subject labels from the publisher (feed categories, departments). */
  subjects?: string[];
  /** Skip the medical-relevance check when the publisher is itself biomedical. */
  biomedicalPublisher?: boolean;
  /**
   * Only accept titles that name research or doctoral work. Used for health
   * services, where a "fellowship" is often clinical training, not research.
   */
  requireResearchTitle?: boolean;
};

/**
 * Turns a publisher's job posting into an opportunity record, or null when it
 * is not a research position we list (PhD, postdoc, fellowship, research
 * assistant/associate) or not in medicine and the biomedical sciences.
 */
export function toPositionRecord(input: PositionInput): OpportunityIngestionRecord | null {
  const title = decodeEntities(input.title).replace(/\s+/g, " ").trim();
  const type = classifyPositionTitle(title);
  if (!type) return null;
  if (input.requireResearchTitle && !/\b(research|ph\.?\s?d|doctoral|post-?doc\w*)\b/i.test(title)) return null;
  const description = cleanDescription(input.descriptionHtml, 1200);
  const subjects = input.subjects ?? [];
  if (!input.biomedicalPublisher && !isMedicalText(title, subjects.join(" "), description?.slice(0, 600))) return null;
  const searchable = [title, description ?? "", ...subjects].join(" ");
  const countryCode = input.countryCode
    ?? countryCodeFromText(input.location)
    ?? input.organization.countryCode
    ?? null;
  return {
    sourceRecordId: input.sourceRecordId,
    sourceUrl: input.sourceUrl,
    applicationUrl: input.applicationUrl ?? null,
    type,
    title,
    description,
    organization: { ...input.organization, countryCode: input.organization.countryCode ?? countryCode },
    city: input.city ?? null,
    countryCode,
    deadline: input.deadline ?? null,
    publishedAt: input.publishedAt ?? null,
    topicSlugs: topicSlugsFor(searchable),
    methodSlugs: methodSlugsFor(searchable),
    eligibleCareerStages: careerStagesForPosition(type, searchable),
    status: "ACTIVE",
  };
}

const DEADLINE_PATTERN = /(?:application deadline|closing date|deadline(?: for applications)?|apply by|applications? (?:close|due)(?: on)?)\s*(?:is|:)?\s*(\d{1,2}(?:st|nd|rd|th)? [A-Z][a-z]+ \d{4}|[A-Z][a-z]+ \d{1,2}(?:st|nd|rd|th)?,? \d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}[./]\d{1,2}[./]\d{4})/i;

/** Finds an application deadline stated in free text. Returns a YYYY-MM-DD date or null. */
export function deadlineFromText(text: string | null | undefined, now: Date): string | null {
  const raw = text?.match(DEADLINE_PATTERN)?.[1];
  if (!raw) return null;
  let date: Date | null = null;
  const numeric = raw.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (numeric) {
    // European order (day first) is the common convention in these listings.
    date = new Date(Date.UTC(Number(numeric[3]), Number(numeric[2]) - 1, Number(numeric[1])));
  } else {
    const parsed = new Date(raw.replace(/(\d)(st|nd|rd|th)/, "$1") + " UTC");
    date = Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (!date || Number.isNaN(date.getTime())) return null;
  const iso = date.toISOString().slice(0, 10);
  // Ignore dates that are clearly not a future deadline (e.g. a start date years away).
  const days = (date.getTime() - now.getTime()) / 86_400_000;
  return days > -1 && days < 400 ? iso : null;
}
