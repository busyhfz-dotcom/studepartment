import type { OpportunityIngestionRecord } from "../ingestion";
import { openPublisher } from "./official-pages";
import { toPositionRecord } from "./positions";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://centers.ibs.re.kr/_prog/jobopenings/?menu_dvs_cd=0503&site_dvs_cd=cgi";
const center = "Center for Genomic Integrity";

export function ibsGenomicIntegrityRecords(html: string, now: Date): OpportunityIngestionRecord[] {
  if (!/Closing Date/i.test(html) || !/<th[^>]*>Department<\/th>/i.test(html)) {
    throw new Error("IBS careers board structure was not recognized");
  }
  const records: OpportunityIngestionRecord[] = [];
  for (const [, row] of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(([, cell]) => cell);
    if (cells.length !== 5) continue;
    const status = htmlToText(cells[1]).replaceAll("\u200b", "").trim();
    const department = htmlToText(cells[3]).trim();
    if (!/^(open|ongoing|recruiting|in progress)$/i.test(status) || department !== center) continue;

    const date = htmlToText(cells[4]).trim().match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})$/);
    const href = cells[2].match(/<a\b[^>]*\bhref=["']([^"']+)["']/i)?.[1];
    if (!date || !href) continue;
    const deadline = new Date(date[1] + "T" + date[2] + ":00+09:00");
    const listing = new URL(href.replaceAll("&amp;", "&"), homepage);
    const id = listing.searchParams.get("mng_no");
    if (listing.origin !== new URL(homepage).origin || !id || !/^\d+$/.test(id) || !(deadline > now)) continue;

    const opening = htmlToText(cells[2]).trim();
    if (!opening) continue;
    const title = opening.includes(center) ? opening : opening + " · " + center;
    const record = toPositionRecord({
      sourceRecordId: id,
      title,
      organization: { name: "Institute for Basic Science", type: "RESEARCH_INSTITUTE", countryCode: "KR", website: "https://www.ibs.re.kr/" },
      countryCode: "KR",
      sourceUrl: listing.href,
      applicationUrl: listing.href,
      deadline: deadline.toISOString(),
      subjects: ["DNA repair", "Genome integrity", "Molecular biology"],
      biomedicalPublisher: true,
    });
    if (record) records.push({ ...record, deadlineTimezone: "Asia/Seoul" });
  }
  return records;
}

export const ibsGenomicIntegritySource: OpportunitySourceConnector = {
  id: "ibs-genomic-integrity-research",
  source: { type: "INSTITUTIONAL_CAREERS", name: "Institute for Basic Science Center for Genomic Integrity", verified: true },
  kind: "positions",
  homepage,
  description: "Research openings from the official Center for Genomic Integrity job board in South Korea.",
  completeSnapshot: false,
  intervalMinutes: 360,
  isEnabled: () => true,
  async collect({ fetch, now }) {
    const read = await openPublisher(fetch, homepage);
    return ibsGenomicIntegrityRecords(await read(homepage), now);
  },
};
