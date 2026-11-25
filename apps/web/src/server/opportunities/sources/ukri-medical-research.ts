import type { OpportunityIngestionRecord } from "../ingestion";
import { isMedicalText, topicSlugsFor } from "./classify";
import { englishDate, openPublisher } from "./official-pages";
import { decodeEntities, htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://www.ukri.org/opportunity/?filter_council%5B0%5D=824&filter_status%5B0%5D=open&filter_status%5B1%5D=upcoming&filter_submitted=true";
const maxPages = 5;
const mrc = { name: "Medical Research Council", website: "https://www.ukri.org/councils/mrc/" };
const bbsrc = { name: "Biotechnology and Biological Sciences Research Council", website: "https://www.ukri.org/councils/bbsrc/" };
const bioscienceHomepage = homepage.replace("=824&", "=816&");
const relatedCouncils = [
  { code: "820", name: "Engineering and Physical Sciences Research Council", website: "https://www.ukri.org/councils/epsrc/" },
  { code: "818", name: "Economic and Social Research Council", website: "https://www.ukri.org/councils/esrc/" },
  { code: "822", name: "Innovate UK", website: "https://www.ukri.org/councils/innovate-uk/" },
  { code: "826", name: "Natural Environment Research Council", website: "https://www.ukri.org/councils/nerc/" },
];

function londonDate(field: string | undefined) {
  if (!field) return null;
  const local = field.match(/\bdatetime="(20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})"/i)?.[1];
  if (!local) {
    const day = htmlToText(field).match(/\d{1,2} [A-Za-z]+ 20\d{2}/)?.[0];
    return day ? englishDate(day) : null;
  }
  const date = new Date(local + "Z");
  if (!Number.isFinite(date.getTime())) return null;
  const zone = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", timeZoneName: "longOffset" })
    .formatToParts(date).find((part) => part.type === "timeZoneName")?.value;
  return zone === "GMT" ? local + "Z" : zone ? local + zone.slice(3) : null;
}

function amount(field: string | undefined) {
  return htmlToText(field?.replace(/&pound;/gi, "£")).match(/^£([\d,]+(?:\.\d{2})?)$/)?.[1]?.replaceAll(",", "");
}

export function mrcFundingPage(html: string, now: Date, council = mrc) {
  const cards = Array.from(html.matchAll(/<div id="post-(\d+)"[^>]*>([\s\S]*?)<!-- #post -->/gi));
  if (!/Funding opportunity list/i.test(html) || !cards.length) throw new Error("UKRI's funding list was not recognized");
  const records = cards.flatMap(([, id, card]): OpportunityIngestionRecord[] => {
    const link = card.match(/<a class="ukri-funding-opp__link" href="(https:\/\/www\.ukri\.org\/opportunity\/[a-z0-9-]+\/)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!link) return [];
    const [, sourceUrl, titleMarkup] = link;
    const title = htmlToText(titleMarkup);
    const fields = new Map(Array.from(card.matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/gi),
      ([, name, field]) => [htmlToText(name).replace(/:$/, ""), field]));
    const funders = htmlToText(fields.get("Funders"));
    if (!funders.includes(council.name)) return [];
    if (council === bbsrc && (funders.includes(mrc.name) || !(
      /bbsrc (?:standard research grant|new investigator|fellowships?)/i.test(title) || isMedicalText(title)
    ))) return [];
    const relatedIndex = relatedCouncils.findIndex(({ name }) => name === council.name);
    if (relatedIndex >= 0 && (!isMedicalText(title) || funders.includes(mrc.name) || funders.includes(bbsrc.name)
      || relatedCouncils.slice(0, relatedIndex).some(({ name }) => funders.includes(name)))) return [];
    const status = htmlToText(fields.get("Opportunity status"));
    if (status !== "Open" && status !== "Upcoming") return [];
    const types = htmlToText(fields.get("Funding type"));
    if (!/\b(grant|fellowship|studentship)\b/i.test(types)) return [];
    const opening = londonDate(fields.get("Opening date"));
    const deadline = londonDate(fields.get("Closing date"));
    const rolling = /no closing date|open ended|open on a rolling basis/i.test(htmlToText(fields.get("Closing date")));
    if (!deadline && !rolling) return [];
    if (deadline && Date.parse(deadline) + (deadline.length === 10 ? 86_400_000 : 0) < now.getTime()) return [];
    const published = htmlToText(fields.get("Publication date"));
    const range = htmlToText(fields.get("Award range")?.replace(/&pound;/gi, "£"))
      .match(/^(£[\d,]+(?:\.\d{2})?)\s*[-–—]\s*(£[\d,]+(?:\.\d{2})?)$/);
    return [{
      sourceRecordId: id,
      sourceUrl,
      applicationUrl: sourceUrl,
      type: /\bfellowship\b/i.test(types) && !/\bgrant\b/i.test(types) ? "FELLOWSHIP" : "GRANT",
      title,
      description: status === "Upcoming" && opening ? `${council.name} funding. The call opens ${opening.slice(0, 10)}. View the original UKRI opportunity for eligibility.` : null,
      organization: { ...council, type: "FOUNDATION", countryCode: "GB" },
      countryCode: "GB",
      publishedAt: published ? englishDate(published) : null,
      deadline: deadline ?? "rolling",
      deadlineTimezone: "Europe/London",
      topicSlugs: topicSlugsFor(title),
      metadata: {
        status: status === "Upcoming" ? "forthcoming" : "open",
        fundingRegion: "United Kingdom",
        openingDate: opening,
        awardMin: amount(fields.get("Minimum award")) ?? amount(range?.[1]) ?? null,
        awardMax: amount(fields.get("Maximum award")) ?? amount(range?.[2]) ?? null,
        awardCurrency: "GBP",
      },
    }];
  });
  const next = html.match(/<a\s+class="next page-numbers"\s+href="([^"]+)"/i)?.[1];
  return { records, next: next ? decodeEntities(next) : null };
}

function fundingSource(council: typeof mrc, url: string, id: string, description: string): OpportunitySourceConnector {
  return {
    id,
    source: { type: "FUNDER", name: `UKRI ${council.name}`, verified: true },
    kind: "grants",
    homepage: url,
    description,
    completeSnapshot: true,
    allowEmptySnapshot: true,
    staleGraceHours: 24,
    intervalMinutes: 360,
    isEnabled: () => true,
    async collect({ fetch, now }) {
      const read = await openPublisher(fetch, url);
      const records: OpportunityIngestionRecord[] = [];
      let next: string | null = url;
      for (let page = 0; next && page < maxPages; page += 1) {
        const result = mrcFundingPage(await read(next), now, council);
        records.push(...result.records);
        next = result.next;
      }
      if (next) throw new Error("UKRI's funding call list exceeded the configured page budget");
      return records;
    },
  };
}

export const ukriMedicalResearchSource = fundingSource(mrc, homepage, "ukri-medical-research-council",
  "Current and announced UKRI Medical Research Council grant and fellowship calls, with published closing dates.");

export const ukriBioscienceSource = fundingSource(bbsrc, bioscienceHomepage, "ukri-biomedical-bioscience",
  "Open and upcoming UKRI biotechnology, biological science and biomedical research grants.");

export const ukriRelatedMedicalSources = relatedCouncils.map(council => fundingSource(
  council,
  homepage.replace("=824&", `=${council.code}&`),
  `ukri-medical-cross-disciplinary-${council.code}`,
  `Open and upcoming health-related funding from ${council.name}.`,
));
