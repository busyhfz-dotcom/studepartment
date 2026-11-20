import type { OpportunityIngestionRecord } from "../ingestion";
import { englishDate, openPublisher } from "./official-pages";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://english.ucas.ac.cn/index.php/admission/international-students/financial-aid";
const institution = "University of Chinese Academy of Sciences";
const heading = /(?:chinese-government-scholarship|cas-anso-scholarship|ucas-scholarship-for-international-students)/;

export function ucasCallLinks(index: string, now: Date): string[] {
  const cycle = now.getUTCFullYear();
  const links = new Map<string, { year: number; path: string }>();
  const path = new URL(homepage).pathname;
  for (const [, href] of index.matchAll(/href=["']([^"']+)["']/gi)) {
    if (!href.startsWith(path + "/")) continue;
    const slug = href.slice(path.length + 1);
    if (!/^\d+-[a-z0-9-]+$/.test(slug)) continue;
    const programme = slug.match(heading)?.[0];
    const year = Number(slug.match(/\b20\d{2}\b/)?.[0]);
    if (!programme || !Number.isFinite(year) || year < cycle || year > cycle + 1) continue;
    const prior = links.get(programme);
    if (!prior || prior.year < year) links.set(programme, { year, path: href });
  }
  return [...links.values()].map((call) => call.path);
}

export function ucasRecords(html: string, url: string, now: Date): OpportunityIngestionRecord[] {
  const title = htmlToText(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1])
    .replace(/\s*-\s*University of Chinese Academy of Sciences\s*$/i, "");
  const body = htmlToText(html);
  const year = url.match(/\b20\d{2}\b/)?.[0];
  const id = new URL(url).pathname.split("/").at(-1)?.match(/^\d+/)?.[0];
  const deadlineText = body.match(/\b(?:application deadline|deadline for applicants(?: and referees)?)\s*:?\s*(?:for phd and master['’]s programs:\s*)?([\w ,]+?\b20\d{2})\s*\(Beijing Time\)/i)?.[1];
  const date = deadlineText ? englishDate(deadlineText) : null;
  // The publisher supplies a calendar date in Beijing. Keep its local day as the display deadline.
  const localDay = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (!id || !year || !title.includes(year) || !/scholarship/i.test(title) || !date?.startsWith(year) || date < localDay) return [];
  if (/applications?\s+(?:(?:are|is|have)\s+)?(?:now\s+)?closed/i.test(body)) return [];
  const opening = body.match(/open for application on\s+([\w ,]+?\b20\d{2})/i)?.[1];
  if (opening) {
    const opensOn = englishDate(opening);
    if (!opensOn || opensOn > localDay) return [];
  }

  const types: Array<"MASTERS_SCHOLARSHIP" | "PHD_SCHOLARSHIP"> = [];
  if (/\bmaster(?:['’]s|s)?\s*(?:\/|and\b|degree|program|student|candidate)/i.test(body)) types.push("MASTERS_SCHOLARSHIP");
  if (/\b(?:doctoral|ph\.?d)\s*(?:\/|and\b|degree|program|student|candidate)/i.test(body)) types.push("PHD_SCHOLARSHIP");
  return types.map((type) => {
    const level = type === "MASTERS_SCHOLARSHIP" ? "Master’s" : "PhD";
    return {
      sourceRecordId: `${id}:${type}`,
      sourceUrl: url,
      applicationUrl: url,
      type,
      title,
      description: `Funding for international ${level} students at the University of Chinese Academy of Sciences. This is a university-wide call. Check the eligible degree programmes, research institutes and application instructions on the official call page.`,
      organization: { name: institution, type: "UNIVERSITY", countryCode: "CN", website: new URL(homepage).origin },
      countryCode: "CN",
      deadline: date,
      deadlineTimezone: "Asia/Shanghai",
      eligibleCareerStages: [type === "MASTERS_SCHOLARSHIP" ? "masters" : "phd"],
      metadata: { degreeFunding: true, applicationCycle: year },
    };
  });
}

export const ucasScholarshipsSource: OpportunitySourceConnector = {
  id: "ucas-international-scholarships",
  source: { type: "FUNDER", name: "UCAS International Scholarships", verified: true },
  kind: "scholarships",
  homepage,
  description: "Official annual Chinese Government, CAS-ANSO and UCAS scholarship calls for international graduate students.",
  completeSnapshot: true,
  staleGraceHours: 24,
  intervalMinutes: 360,
  isEnabled: () => true,
  async collect({ fetch, now }) {
    const page = await openPublisher(fetch, homepage);
    const index = await page(homepage);
    if (!/Financial Aids/i.test(index)) throw new Error("UCAS's financial aid index was not recognized");
    const calls = ucasCallLinks(index, now);
    const records: OpportunityIngestionRecord[] = [];
    for (const path of calls) {
      records.push(...ucasRecords(await page(path), new URL(path, homepage).href, now));
    }
    return records;
  },
};
