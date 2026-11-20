import type { OpportunityIngestionRecord } from "../ingestion";
import { countryCodeFromText, isMedicalText, topicSlugsFor } from "./classify";
import { openPublisher } from "./official-pages";
import { toPositionRecord } from "./positions";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const ethBoard = "https://jobs.ethz.ch/site/index";
const lihBoard = "https://www.lih.lu/en/careers/";

export function ethResearchRecords(html: string): OpportunityIngestionRecord[] {
  const cards = Array.from(html.matchAll(/<a href="(\/job\/view\/([A-Za-z0-9_\-]+))"[^>]*class="job-ad__item__link"[^>]*>([\s\S]*?)<\/a>/gi));
  if (!cards.length || !/Stellenangebote der ETH/i.test(html)) throw new Error("ETH Zurich's job listing was not recognized");
  return cards.flatMap(([, path, id, card]) => {
    const title = htmlToText(card.match(/class="job-ad__item__title">([\s\S]*?)<\/h3>/i)?.[1]);
    const location = htmlToText(card.match(/class="job-ad__item__details">([\s\S]*?)<\/div>/i)?.[1]);
    const employer = htmlToText(card.match(/class="job-ad__item__company">([\s\S]*?)<\/div>/i)?.[1]);
    if (!title || /\benvironmental microbiology\b/i.test(title) && !/\b(?:health|disease|medical)\b/i.test(title)) return [];
    if (!isMedicalText(title, employer, /Health Sciences and Technology|Gesundheitswissenschaften/.test(employer) ? "health research" : "")) return [];
    const day = employer.match(/^(\d{2})\.(\d{2})\.(20\d{2})/);
    const sourceUrl = new URL(path, ethBoard).href;
    const country = countryCodeFromText(location) ?? "CH";
    const city = location.match(/^\s*[^,]+,\s*([^,]+)/)?.[1]?.trim();
    const record = toPositionRecord({
      sourceRecordId: id,
      sourceUrl,
      applicationUrl: sourceUrl,
      title,
      organization: { name: "ETH Zurich", type: "UNIVERSITY", website: "https://ethz.ch/en.html", countryCode: "CH" },
      countryCode: country,
      city,
      publishedAt: day ? `${day[3]}-${day[2]}-${day[1]}` : null,
      biomedicalPublisher: true,
    });
    if (!record) return [];
    return [{ ...record, topicSlugs: topicSlugsFor(`${title} ${employer}`) }];
  });
}

export function lihResearchRecords(html: string): OpportunityIngestionRecord[] {
  const cards = Array.from(html.matchAll(/<a class="ia-block-jobs__title" href="([^"]+)">([\s\S]*?)<\/a>/gi));
  if (!cards.length || !/Luxembourg Institute of Health/i.test(html)) throw new Error("LIH's public vacancy list was not recognized");
  return cards.flatMap(([, url, markup]) => {
    const source = new URL(url, lihBoard);
    const id = source.searchParams.get("value");
    if (!id || source.origin !== new URL(lihBoard).origin || source.pathname !== "/en/job/") return [];
    const title = htmlToText(markup);
    const record = toPositionRecord({
      sourceRecordId: id,
      sourceUrl: source.href,
      applicationUrl: source.href,
      title,
      organization: { name: "Luxembourg Institute of Health", type: "RESEARCH_INSTITUTE", website: lihBoard, countryCode: "LU" },
      countryCode: "LU",
      biomedicalPublisher: true,
    });
    return record ? [record] : [];
  });
}

export const continentalCareerSources: OpportunitySourceConnector[] = [
  {
    id: "eth-zurich-research",
    source: { type: "INSTITUTIONAL_CAREERS", name: "ETH Zurich Careers", verified: true },
    kind: "positions",
    homepage: ethBoard,
    description: "Biomedical PhD and research appointments listed on ETH Zurich’s own public job board.",
    completeSnapshot: true,
    allowEmptySnapshot: true,
    staleGraceHours: 24,
    intervalMinutes: 360,
    isEnabled: () => true,
    async collect({ fetch }) {
      const read = await openPublisher(fetch, ethBoard);
      return ethResearchRecords(await read(ethBoard));
    },
  },
  {
    id: "luxembourg-institute-health",
    source: { type: "INSTITUTIONAL_CAREERS", name: "Luxembourg Institute of Health Careers", verified: true },
    kind: "positions",
    homepage: lihBoard,
    description: "Doctoral, postdoctoral and clinical research positions from Luxembourg’s public biomedical research institute.",
    completeSnapshot: true,
    allowEmptySnapshot: true,
    staleGraceHours: 24,
    intervalMinutes: 360,
    isEnabled: () => true,
    async collect({ fetch }) {
      const read = await openPublisher(fetch, lihBoard);
      return lihResearchRecords(await read(lihBoard));
    },
  },
];
