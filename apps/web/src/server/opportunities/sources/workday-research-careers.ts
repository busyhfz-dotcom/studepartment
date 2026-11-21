import type { OpportunityIngestionRecord } from "../ingestion";
import { classifyPositionTitle } from "./classify";
import { mapWithConcurrency, SourceRequestError } from "./http";
import { openPublisher } from "./official-pages";
import { deadlineFromText, toPositionRecord } from "./positions";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

type Board = { id: string; name: string; host: string; site: string; country: string; timezone: string; website: string };
type Posting = { title: string; externalPath: string; locationsText?: string };
type Job = {
  title?: string; jobReqId?: string; jobDescription?: string;
  canApply?: boolean; posted?: boolean; startDate?: string; endDate?: string; location?: string;
  jobRequisitionLocation?: { country?: { alpha2Code?: string } };
};
type Listings = { total: number; jobPostings: Posting[] };

const boards: Board[] = [
  { id: "ubc", name: "University of British Columbia", host: "ubc.wd10.myworkdayjobs.com", site: "ubcstaffjobs", country: "CA", timezone: "America/Vancouver", website: "https://www.ubc.ca" },
  { id: "sydney", name: "University of Sydney", host: "usyd.wd105.myworkdayjobs.com", site: "USYD_EXTERNAL_CAREER_SITE", country: "AU", timezone: "Australia/Sydney", website: "https://www.sydney.edu.au" },
];
const pageSize = 20;
const maxResults = 320;
const maxDetails = 135;
const isoDay = /^20\d{2}-\d{2}-\d{2}$/;

function jobRecord(job: Job, posting: Posting, board: Board, now: Date): OpportunityIngestionRecord | null {
  if (job.canApply !== true || job.posted === false || !job.jobReqId) return null;
  const title = job.title || posting.title;
  const publishedAt = isoDay.test(job.startDate ?? "") ? job.startDate : null;
  const deadline = isoDay.test(job.endDate ?? "") ? job.endDate : deadlineFromText(htmlToText(job.jobDescription), now);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: board.timezone }).format(now);
  if ((deadline && deadline < today) || (publishedAt && publishedAt > today)) return null;
  const sourceUrl = `https://${board.host}/${board.site}${posting.externalPath}`;
  const department = htmlToText(job.jobDescription?.match(/<h2>\s*(?:<b>)?Department(?:<\/b>)?\s*<\/h2>([\s\S]{1,400}?)(?=<h[23]|$)/i)?.[1]);
  const location = job.location ?? posting.locationsText;
  const country = job.jobRequisitionLocation?.country?.alpha2Code ?? board.country;
  const record = toPositionRecord({
    sourceRecordId: job.jobReqId, sourceUrl, applicationUrl: sourceUrl, title,
    countryCode: country, location, publishedAt, deadline, descriptionHtml: job.jobDescription, subjects: [department],
    organization: { name: board.name, type: "UNIVERSITY", website: board.website, countryCode: board.country },
  });
  return record ? { ...record, description: null, deadlineTimezone: board.timezone } : null;
}

export const workdayResearchSources: OpportunitySourceConnector[] = boards.map(board => {
  const homepage = `https://${board.host}/${board.site}`;
  const api = `https://${board.host}/wday/cxs/${board.host.split(".")[0]}/${board.site}`;
  return {
    id: `workday-research-${board.id}`,
    source: { type: "INSTITUTIONAL_CAREERS", name: `${board.name} staff research vacancies`, verified: true },
    kind: "positions",
    homepage,
    description: `Open biomedical research appointments from ${board.name}'s official careers site.`,
    completeSnapshot: true,
    allowEmptySnapshot: true,
    staleGraceHours: 24,
    intervalMinutes: 360,
    isEnabled: () => true,
    async collect({ fetch, now }) {
      const read = await openPublisher(fetch, homepage);
      const readPage = async (offset: number) => {
        const body = JSON.stringify({ appliedFacets: {}, limit: pageSize, offset, searchText: "research" });
        const page = JSON.parse(await read(`${api}/jobs`, {
          method: "POST", headers: { accept: "application/json", "content-type": "application/json" }, body,
        })) as Listings;
        if (!Number.isInteger(page.total) || page.total < 0 || page.total > maxResults || !Array.isArray(page.jobPostings)) {
          throw new Error(`${board.name} did not return a complete bounded careers search`);
        }
        return page;
      };

      const first = await readPage(0);
      const offsets = Array.from({ length: Math.max(0, Math.ceil(first.total / pageSize) - 1) }, (_, index) => (index + 1) * pageSize);
      const other = await mapWithConcurrency(offsets, 2, readPage);
      const listings = [first, ...other].flatMap(page => page.jobPostings);
      const paths = new Map(listings.map(posting => [posting.externalPath, posting]));
      if (paths.size !== first.total) throw new Error(`${board.name}'s vacancy list changed while it was being read`);
      const candidates = [...paths.values()].filter(posting =>
        typeof posting.title === "string" && Boolean(classifyPositionTitle(posting.title))
        && /^\/job\/(?:[A-Za-z0-9._%~-]+\/)*[A-Za-z0-9._%~-]+$/.test(posting.externalPath),
      );
      if (candidates.length > maxDetails) throw new Error(`${board.name}'s vacancy detail budget was exceeded`);
      const results = await mapWithConcurrency(candidates, 3, async posting => {
        try {
          const details = JSON.parse(await read(`${api}${posting.externalPath}`, { headers: { accept: "application/json" } })) as { jobPostingInfo?: Job };
          return details.jobPostingInfo ? jobRecord(details.jobPostingInfo, posting, board, now) : null;
        } catch (error) {
          if (error instanceof SourceRequestError && [404, 410].includes(error.status)) return null;
          throw error;
        }
      });
      const unique = new Map<string, OpportunityIngestionRecord>();
      for (const result of results) if (result) unique.set(result.sourceRecordId, result);
      return [...unique.values()];
    },
  };
});
