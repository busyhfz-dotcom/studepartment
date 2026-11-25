import type { OpportunityIngestionRecord } from "../ingestion";
import { openPublisher } from "./official-pages";
import { toPositionRecord } from "./positions";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://antonivanleeuwenhoek.recruitee.com";
const organization = { name: "Netherlands Cancer Institute", type: "RESEARCH_INSTITUTE" as const, countryCode: "NL", website: "https://www.nki.nl" };
type Vacancy = {
  id: number; title: string; status: string; department?: string; careers_url: string; careers_apply_url?: string;
  published_at?: string; close_at?: string; description?: string; city?: string;
};

function timestamp(value?: string) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

export function nkiResearchRecords(payload: unknown, now: Date): OpportunityIngestionRecord[] {
  const offers = (payload as { offers?: Vacancy[] } | null)?.offers;
  if (!Array.isArray(offers) || offers.length > 350) throw new Error("NKI vacancy list was not recognized");
  return offers.flatMap(job => {
    if (job.status !== "published" || !job.department?.match(/^Research \(NKI\)$/i)) return [];
    if (!job.careers_url?.startsWith(homepage + "/o/")) return [];
    const deadline = timestamp(job.close_at);
    const publishedAt = timestamp(job.published_at);
    if ((deadline && Date.parse(deadline) <= now.getTime()) || (publishedAt && Date.parse(publishedAt) > now.getTime())) return [];
    const clinical = /\bonderzoeker\b/i.test(job.title);
    const clinicalTitle = clinical ? job.title + " · Clinical researcher" : job.title;
    const record = toPositionRecord({
      sourceRecordId: String(job.id),
      title: clinicalTitle,
      descriptionHtml: job.description,
      sourceUrl: job.careers_url,
      applicationUrl: job.careers_apply_url?.startsWith(homepage + "/") ? job.careers_apply_url : job.careers_url,
      countryCode: "NL", city: job.city ?? "Amsterdam", organization,
      publishedAt,
      deadline: deadline ?? (/remain open until|rolling basis/i.test(htmlToText(job.description)) ? "Rolling" : null),
      subjects: [/melanoom/i.test(job.title) ? "Melanoma cancer immunotherapy" : "Oncology"],
      biomedicalPublisher: true,
    });
    return record ? [record] : [];
  });
}

export const nkiResearchCareersSource: OpportunitySourceConnector = {
  id: "nki-research-careers",
  source: { type: "INSTITUTIONAL_CAREERS", name: "Netherlands Cancer Institute research careers", verified: true },
  kind: "positions", homepage: "https://www.nki.nl/careers-study/vacancies/",
  description: "Published research roles and funded PhD vacancies from the Netherlands Cancer Institute’s official hiring feed.",
  completeSnapshot: true, allowEmptySnapshot: true, staleGraceHours: 24, intervalMinutes: 360,
  isEnabled: () => true,
  async collect({ fetch, now }) {
    const read = await openPublisher(fetch, homepage);
    return nkiResearchRecords(JSON.parse(await read(homepage + "/api/offers", { headers: { accept: "application/json" } })), now);
  },
};
