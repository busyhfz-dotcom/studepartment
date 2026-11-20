import type { OpportunityIngestionRecord } from "../ingestion";
import { topicSlugsFor } from "./classify";
import { englishDate, openPublisher } from "./official-pages";
import { cleanDescription } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://wellcome.org/research-funding/schemes";
const origin = new URL(homepage).origin;

type Scheme = {
  id?: string;
  url?: string;
  title?: string;
  listing_summary?: string;
  scheme_accepting_applications?: string;
  scheme_closes_for_applications?: string;
  scheme_opens_for_applications?: string;
  multiple_deadline_dates?: string;
  location_ref?: Array<{ name?: string }>;
};

export function wellcomeRecords(html: string, now: Date): OpportunityIngestionRecord[] {
  const payload = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
  const listing = payload ? JSON.parse(payload).props?.pageProps as {
    initialListings?: Scheme[];
    initialPagination?: { total_pages?: number };
  } | undefined : undefined;
  const schemes = listing?.initialListings;
  if (!Array.isArray(schemes) || !schemes.some((item) => typeof item.scheme_accepting_applications === "string")) {
    throw new Error("Wellcome's published funding list was not recognized");
  }
  if (listing?.initialPagination?.total_pages !== 1) {
    throw new Error("Wellcome's overview no longer contains a complete funding list");
  }

  const today = now.toISOString().slice(0, 10);
  return schemes.flatMap((scheme) => {
    const title = scheme.title?.trim();
    if (!title || !scheme.id || !scheme.url?.match(/^\/research-funding\/schemes\/[a-z0-9-]+$/)) return [];
    // Partner-led and decentralised training schemes have their own eligibility and calendars.
    if (/^Springboard Awards$|^Starter Grants for Clinical Lecturers$|\bPhD\b/i.test(title)) return [];
    const isRolling = scheme.scheme_accepting_applications === "Apply anytime";
    if (!isRolling && scheme.scheme_accepting_applications !== "Open to applications") return [];
    const opens = scheme.scheme_opens_for_applications?.trim();
    const opensOn = opens ? englishDate(opens) : null;
    if (opens && (!opensOn || opensOn > today)) return [];
    const closes = scheme.scheme_closes_for_applications?.trim();
    const closesOn = closes ? englishDate(closes) : null;
    if (!isRolling && (!closesOn || closesOn < today || scheme.multiple_deadline_dates === "Yes")) return [];

    const sourceUrl = origin + scheme.url;
    const description = cleanDescription(scheme.listing_summary, 500);
    const regions = scheme.location_ref?.map((item) => item.name?.trim()).filter(Boolean) ?? [];
    return [{
      sourceRecordId: scheme.id,
      sourceUrl,
      applicationUrl: sourceUrl,
      type: "GRANT",
      title,
      description: description ? `${description} Source: Wellcome (CC BY 4.0).` : null,
      organization: { name: "Wellcome", type: "FOUNDATION", countryCode: "GB", website: origin },
      // Geography is shown separately from the funder's base in the grant table.
      countryCode: "GB",
      deadline: isRolling ? "rolling" : closesOn,
      topicSlugs: topicSlugsFor(`${title} ${description ?? ""}`),
      metadata: { status: "open", eligibilityRegion: regions.join("; "), attribution: "Wellcome (CC BY 4.0)" },
    }];
  });
}

export const wellcomeSource: OpportunitySourceConnector = {
  id: "wellcome-grants",
  source: { type: "FUNDER", name: "Wellcome Research Funding", verified: true },
  kind: "grants",
  homepage,
  description: "Open and rolling research grants published by Wellcome, with application details at the funder.",
  completeSnapshot: true,
  staleGraceHours: 24,
  intervalMinutes: 240,
  isEnabled: () => true,
  async collect({ fetch, now }) {
    const page = await openPublisher(fetch, homepage);
    return wellcomeRecords(await page(homepage), now);
  },
};
