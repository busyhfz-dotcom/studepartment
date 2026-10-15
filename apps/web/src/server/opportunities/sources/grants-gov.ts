import type { OpportunityIngestionRecord } from "../ingestion";
import { isMedicalText, methodSlugsFor, topicSlugsFor } from "./classify";
import { mapWithConcurrency, requestJson } from "./http";
import { cleanDescription, decodeEntities } from "./text";
import type { OpportunitySourceConnector, SourceContext } from "./types";

const API = "https://api.grants.gov/v1/api";

type SearchHit = {
  id: string;
  number: string;
  title: string;
  agencyCode: string;
  agency: string;
  openDate?: string;
  closeDate?: string;
  oppStatus: string;
  docType?: string;
};

type SearchResponse = { errorcode?: number; data?: { hitCount: number; oppHits: SearchHit[] } };

type Synopsis = {
  synopsisDesc?: string;
  applicantEligibilityDesc?: string;
  applicantTypes?: Array<{ description: string }>;
  awardCeiling?: string;
  fundingDescLinkUrl?: string;
  responseDateDesc?: string;
};

type DetailResponse = { data?: { synopsis?: Synopsis } };

// Agency codes → the funder's public name and website. Grants.gov sub-office
// names ("Centers for Disease Control - OPHPR") are folded into the agency.
const AGENCIES: Array<[RegExp, string, string]> = [
  [/^HHS-NIH/, "National Institutes of Health", "https://www.nih.gov"],
  [/^HHS-CDC/, "Centers for Disease Control and Prevention", "https://www.cdc.gov"],
  [/^HHS-FDA/, "Food and Drug Administration", "https://www.fda.gov"],
  [/^HHS-AHRQ/, "Agency for Healthcare Research and Quality", "https://www.ahrq.gov"],
  [/^HHS-HRSA/, "Health Resources and Services Administration", "https://www.hrsa.gov"],
  [/^HHS-SAMHS/, "Substance Abuse and Mental Health Services Administration", "https://www.samhsa.gov"],
  [/^HHS-IHS/, "Indian Health Service", "https://www.ihs.gov"],
  [/^DOD-DHA|^DOD-CDMRP|^DOD-AMRAA/, "US Department of Defense health research", "https://cdmrp.health.mil"],
  [/^VA/, "US Department of Veterans Affairs", "https://www.research.va.gov"],
  [/^NSF/, "National Science Foundation", "https://www.nsf.gov"],
];

/** "11/17/2026" → "2026-11-17" (a calendar date; the funder's local close time is in the notice). */
export function grantsGovDate(value: string | undefined): string | null {
  const match = value?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[1]}-${match[2]}` : null;
}

/** NIH activity code in a notice title, e.g. "(F31 Clinical Trial Not Allowed)" → "F31". */
export function activityCode(title: string): string | null {
  for (const group of title.match(/\([^)]*\)/g) ?? []) {
    const code = group.match(/\b([A-Z]\d{2})\b/)?.[1];
    if (code) return code;
  }
  return null;
}

export function grantsGovType(title: string): Pick<OpportunityIngestionRecord, "type" | "eligibleCareerStages"> {
  const code = activityCode(title);
  if (code && /^F(30|31)$/.test(code)) return { type: "FELLOWSHIP", eligibleCareerStages: ["phd"] };
  if (code === "F99") return { type: "FELLOWSHIP", eligibleCareerStages: ["phd"] };
  if (code === "F32") return { type: "FELLOWSHIP", eligibleCareerStages: ["postdoc"] };
  if (code === "F33") return { type: "FELLOWSHIP", eligibleCareerStages: ["faculty"] };
  if (code === "K99") return { type: "GRANT", eligibleCareerStages: ["postdoc"] };
  if (code && /^K(01|07|08|23|25)$/.test(code)) return { type: "GRANT", eligibleCareerStages: ["early-career-researcher"] };
  if (/\bfellowship\b/i.test(title)) return { type: "FELLOWSHIP", eligibleCareerStages: [] };
  return { type: "GRANT", eligibleCareerStages: [] };
}

export function toGrantsGovRecord(hit: SearchHit, synopsis: Synopsis | undefined): OpportunityIngestionRecord {
  const title = decodeEntities(hit.title).trim();
  const eligibility = synopsis?.applicantTypes?.map((item) => item.description).filter(Boolean) ?? [];
  const body = cleanDescription(synopsis?.synopsisDesc, 1000);
  const description = [
    body,
    eligibility.length ? `Eligible applicants: ${eligibility.slice(0, 6).join("; ")}${eligibility.length > 6 ? "; and others" : ""}.` : null,
    synopsis?.awardCeiling && /^\d+$/.test(synopsis.awardCeiling) ? `Award ceiling: US$${Number(synopsis.awardCeiling).toLocaleString("en-US")}.` : null,
    `Funding opportunity number ${hit.number}.`,
  ].filter(Boolean).join(" ");
  const searchable = `${title} ${body ?? ""}`;
  const agency = AGENCIES.find(([pattern]) => pattern.test(hit.agencyCode));
  const announcement = synopsis?.fundingDescLinkUrl?.trim().replace(/^http:\/\//, "https://");
  return {
    sourceRecordId: hit.id,
    sourceUrl: `https://www.grants.gov/search-results-detail/${hit.id}`,
    applicationUrl: announcement && /^https:\/\//.test(announcement) ? announcement : null,
    ...grantsGovType(title),
    title,
    description,
    organization: { name: agency?.[1] ?? decodeEntities(hit.agency).trim(), type: "FOUNDATION", countryCode: "US", website: agency?.[2] ?? "https://www.grants.gov" },
    city: null,
    countryCode: "US",
    deadline: grantsGovDate(hit.closeDate),
    deadlineTimezone: "America/New_York",
    publishedAt: grantsGovDate(hit.openDate),
    topicSlugs: topicSlugsFor(searchable),
    methodSlugs: methodSlugsFor(searchable),
    status: "ACTIVE",
    metadata: { number: hit.number, agencyCode: hit.agencyCode, oppStatus: hit.oppStatus },
  };
}

async function search(context: SourceContext, filter: Record<string, string>) {
  const hits: SearchHit[] = [];
  for (let start = 0; start < 3000; start += 250) {
    const response = await requestJson<SearchResponse>(context.fetch, `${API}/search2`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rows: 250, startRecordNum: start, oppStatuses: "posted", ...filter }),
    });
    const page = response.data?.oppHits ?? [];
    hits.push(...page);
    if (page.length < 250 || hits.length >= (response.data?.hitCount ?? 0)) break;
  }
  return hits;
}

export const grantsGovSource: OpportunitySourceConnector = {
  id: "grants-gov",
  source: { type: "FUNDER", name: "Grants.gov", verified: true },
  kind: "grants",
  homepage: "https://www.grants.gov",
  description: "US federal funding opportunities in health, including every open NIH notice of funding opportunity.",
  completeSnapshot: true,
  intervalHours: 12,
  isEnabled: () => true,
  async collect(context) {
    const [health, nih] = await Promise.all([
      search(context, { fundingCategories: "HL" }),
      search(context, { agencies: "HHS-NIH11" }),
    ]);
    const unique = new Map<string, SearchHit>();
    for (const hit of [...health, ...nih]) unique.set(hit.id, hit);
    const hits = [...unique.values()].filter((hit) => hit.agencyCode.startsWith("HHS") || isMedicalText(hit.title));
    context.log(`Grants.gov: ${hits.length} posted health opportunities`);
    return mapWithConcurrency(hits, 4, async (hit) => {
      let synopsis: Synopsis | undefined;
      try {
        const detail = await requestJson<DetailResponse>(context.fetch, `${API}/fetchOpportunity`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ opportunityId: Number(hit.id) }),
        });
        synopsis = detail.data?.synopsis;
      } catch {
        // The listing is still worth showing; the description just stays short.
      }
      return toGrantsGovRecord(hit, synopsis);
    });
  },
};
