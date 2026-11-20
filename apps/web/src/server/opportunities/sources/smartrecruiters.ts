import type { OpportunityIngestionRecord } from "../ingestion";
import { classifyPositionTitle } from "./classify";
import { mapWithConcurrency, requestWithRetry, SourceRequestError } from "./http";
import { deadlineFromText, toPositionRecord } from "./positions";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector, SourceContext } from "./types";

type Board = {
  id: string;
  company: string;
  name: string;
  homepage: string;
  country: string;
  organizationType: "HOSPITAL" | "UNIVERSITY";
};
type Posting = {
  id: string;
  name: string;
  uuid?: string;
  defaultJobAd?: boolean;
  releasedDate?: string;
  location?: { city?: string; country?: string };
  department?: { label?: string };
  active?: boolean;
  visibility?: string;
  unpublishOn?: string | null;
  postingUrl?: string;
  jobAd?: { sections?: Record<string, { text?: string }> };
};
type Page = { totalFound: number; content: Posting[] };

const boards: Board[] = [
  { id: "uhn", company: "UniversityHealthNetwork", name: "University Health Network", homepage: "https://www.uhn.ca/corporate/Careers", country: "CA", organizationType: "HOSPITAL" },
  { id: "griffith", company: "GriffithUniversity", name: "Griffith University", homepage: "https://www.griffith.edu.au/jobs-at-griffith", country: "AU", organizationType: "UNIVERSITY" },
  { id: "auckland", company: "TheUniversityOfAuckland", name: "University of Auckland", homepage: "https://www.auckland.ac.nz/en/about-us/jobs-at-auckland.html", country: "NZ", organizationType: "UNIVERSITY" },
];
const PAGE_SIZE = 100;
const MAX_POSTINGS = 300;
const MAX_DETAIL_REQUESTS = 36;

async function getJson<T>(context: SourceContext, url: string) {
  const response = await requestWithRetry(context.fetch, url, { redirect: "error" }, { timeoutMs: 12_000, retries: 0 });
  return (await response.json()) as T;
}

export function smartRecruitersRecord(posting: Posting, board: Board, now: Date): OpportunityIngestionRecord | null {
  if (posting.active === false || !posting.postingUrl || !posting.name) return null;
  const link = new URL(posting.postingUrl);
  if (link.protocol !== "https:" || link.hostname !== "jobs.smartrecruiters.com"
    || !link.pathname.startsWith(`/${board.company}/${posting.id}`)) return null;
  const sections = posting.jobAd?.sections;
  const summary = htmlToText(sections?.jobDescription?.text);
  const additional = htmlToText(sections?.additionalInformation?.text);
  const automaticClose = posting.unpublishOn && Number.isFinite(Date.parse(posting.unpublishOn)) ? posting.unpublishOn : null;
  const deadline = deadlineFromText(`${additional} ${summary}`, now) ?? automaticClose;
  if (automaticClose && Date.parse(automaticClose) < now.getTime()) return null;
  if (deadline && Date.parse(deadline) + (deadline.length === 10 ? 86_400_000 : 0) < now.getTime()) return null;
  const country = posting.location?.country?.toUpperCase();
  const record = toPositionRecord({
    sourceRecordId: posting.id,
    sourceUrl: link.href,
    applicationUrl: link.href,
    title: posting.name,
    descriptionHtml: summary,
    organization: { name: board.name, type: board.organizationType, website: board.homepage, countryCode: board.country },
    countryCode: country && /^[A-Z]{2}$/.test(country) ? country : board.country,
    city: posting.location?.city,
    publishedAt: posting.releasedDate,
    deadline,
    subjects: posting.department?.label ? [posting.department.label] : [],
    biomedicalPublisher: board.organizationType === "HOSPITAL",
    requireResearchTitle: true,
  });
  if (!record) return null;
  if (/\b(?:ph\.?\s?d|doctoral) scholarship/i.test(posting.name)) record.type = "PHD_SCHOLARSHIP";
  else if (record.type === "POSTDOC" && !/\bpost-?doc\w*\b/i.test(posting.name)) record.type = "FELLOWSHIP";
  return { ...record, description: null, metadata: { employerPostingId: posting.id } };
}

export const smartRecruitersSources: OpportunitySourceConnector[] = boards.map((board) => ({
  id: `smartrecruiters-${board.id}`,
  source: { type: "INSTITUTIONAL_CAREERS", name: `${board.name} — published vacancies`, verified: true },
  kind: "positions",
  homepage: board.homepage,
  description: `Biomedical research and doctoral openings on the official ${board.name} Posting API.`,
  completeSnapshot: true,
  allowEmptySnapshot: true,
  staleGraceHours: 24,
  intervalMinutes: 360,
  isEnabled: () => true,
  async collect(context) {
    const endpoint = `https://api.smartrecruiters.com/v1/companies/${board.company}/postings`;
    const page = (offset: number) => getJson<Page>(context, `${endpoint}?limit=${PAGE_SIZE}&offset=${offset}`);
    const first = await page(0);
    if (!Array.isArray(first.content) || !Number.isInteger(first.totalFound) || first.totalFound < 0 || first.totalFound > MAX_POSTINGS) {
      throw new Error("Unexpected or unbounded number of published postings");
    }
    const postings = [...first.content];
    for (let offset = PAGE_SIZE; offset < first.totalFound; offset += PAGE_SIZE) {
      const next = await page(offset);
      if (!Array.isArray(next.content)) throw new Error("An employer posting page was incomplete");
      postings.push(...next.content);
    }
    const unique = new Map(postings.map((posting) => [posting.id, posting]));
    if (unique.size !== first.totalFound) throw new Error("The employer posting list changed during pagination");
    const candidates = [...unique.values()].filter((p) => /^\d+$/.test(p.id) && typeof p.name === "string"
      && p.defaultJobAd !== false && Boolean(classifyPositionTitle(p.name)));
    if (candidates.length > MAX_DETAIL_REQUESTS) throw new Error("Employer research detail budget exceeded");
    const details = await mapWithConcurrency(candidates, 3, async (posting) => {
      try {
        const full = await getJson<Posting>(context, `${endpoint}/${posting.id}`);
        return smartRecruitersRecord(full, board, context.now);
      } catch (error) {
        if (error instanceof SourceRequestError && (error.status === 404 || error.status === 410)) return null;
        throw error;
      }
    });
    return details.filter((item): item is OpportunityIngestionRecord => item !== null);
  },
}));
