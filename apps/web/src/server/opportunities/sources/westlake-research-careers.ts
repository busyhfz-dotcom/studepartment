import type { OpportunityIngestionRecord } from "../ingestion";
import { openPublisher } from "./official-pages";
import { toPositionRecord } from "./positions";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://en.westlake.edu.cn/careers/OpenPositions/";
const recentMs = 90 * 86_400_000;
const biomedicalGroup = /\b(?:School of (?:Life Sciences|Medicine)|Intelligent Biomedical Labs|Center for Infectious Disease Research)\b/i;

export function westlakeResearchRecords(html: string, now: Date): OpportunityIngestionRecord[] {
  const rows = Array.from(html.matchAll(/category:\s*"([^"\r\n]+)",\s*dept:\s*"([^"\r\n]+)",\s*type:\s*"([^"\r\n]+)",\s*url:\s*"(https:\/\/en\.westlake\.edu\.cn\/careers\/OpenPositions\/[a-z_]+\/\d{6}\/t(20\d{2})(\d{2})(\d{2})_(\d+)\.html)"/gi));
  if (!/Westlake(?:&nbsp;|\s)+University/i.test(html) || !rows.length) {
    throw new Error("Westlake University's public career catalogue was not recognized");
  }
  return rows.flatMap(([, category, title, office, sourceUrl, year, month, day, id]) => {
    // The board also keeps years of older undated openings. Index recent ads only.
    const publishedAt = [year, month, day].join("-");
    const age = now.getTime() - Date.parse(publishedAt);
    if (age < -86_400_000 || age > recentMs || !/^(?:Postdoctoral Fellow|Research Team)$/i.test(category)) return [];
    if (!biomedicalGroup.test(office + " " + title) || !/Hangzhou, CN\b/i.test(office)) return [];
    const record = toPositionRecord({
      sourceRecordId: id,
      sourceUrl,
      applicationUrl: sourceUrl,
      title,
      organization: { name: "Westlake University", type: "UNIVERSITY", countryCode: "CN", website: "https://en.westlake.edu.cn/" },
      countryCode: "CN",
      city: "Hangzhou",
      publishedAt,
      biomedicalPublisher: true,
      requireResearchTitle: true,
    });
    return record ? [record] : [];
  });
}

export const westlakeResearchCareersSource: OpportunitySourceConnector = {
  id: "westlake-biomedical-careers",
  source: { type: "INSTITUTIONAL_CAREERS", name: "Westlake University Biomedical Careers", verified: true },
  kind: "positions",
  homepage,
  description: "Recent research vacancies from Westlake University's life sciences and medicine teams.",
  completeSnapshot: true,
  allowEmptySnapshot: true,
  staleGraceHours: 24,
  intervalMinutes: 360,
  isEnabled: () => true,
  async collect({ fetch, now }) {
    const read = await openPublisher(fetch, homepage);
    return westlakeResearchRecords(await read(homepage), now);
  },
};
