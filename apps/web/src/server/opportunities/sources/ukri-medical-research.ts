import type { OpportunityIngestionRecord } from "../ingestion";
import { topicSlugsFor } from "./classify";
import { englishDate, openPublisher } from "./official-pages";
import { decodeEntities, htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://www.ukri.org/opportunity/?filter_council%5B0%5D=824&filter_status%5B0%5D=open&filter_status%5B1%5D=upcoming&filter_submitted=true";
const maxPages = 5;

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
  return htmlToText(field?.replace(/&pound;/gi, "£")).match(/^£([\d,]+)(?:\.\d{2})?$/)?.[1]?.replaceAll(",", "");
}

export function mrcFundingPage(html: string, now: Date) {
  const cards = Array.from(html.matchAll(/<div id="post-(\d+)"[^>]*>([\s\S]*?)<!-- #post -->/gi));
  if (!/Funding opportunity list/i.test(html) || !cards.length) throw new Error("UKRI's funding list was not recognized");
  const records = cards.flatMap(([, id, card]): OpportunityIngestionRecord[] => {
    const link = card.match(/<a class="ukri-funding-opp__link" href="(https:\/\/www\.ukri\.org\/opportunity\/[a-z0-9-]+\/)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!link) return [];
    const [, sourceUrl, titleMarkup] = link;
    const title = htmlToText(titleMarkup);
    const fields = new Map(Array.from(card.matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/gi),
      ([, name, field]) => [htmlToText(name).replace(/:$/, ""), field]));
    if (!/Medical Research Council/i.test(htmlToText(fields.get("Funders")))) return [];
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
    return [{
      sourceRecordId: id,
      sourceUrl,
      applicationUrl: sourceUrl,
      type: /\bfellowship\b/i.test(types) && !/\bgrant\b/i.test(types) ? "FELLOWSHIP" : "GRANT",
      title,
      description: status === "Upcoming" && opening ? `Medical Research Council funding. The call opens ${opening.slice(0, 10)}. View the original UKRI opportunity for eligibility.` : null,
      organization: { name: "Medical Research Council", type: "FOUNDATION", countryCode: "GB", website: "https://www.ukri.org/councils/mrc/" },
      countryCode: "GB",
      publishedAt: published ? englishDate(published) : null,
      deadline: deadline ?? "rolling",
      deadlineTimezone: "Europe/London",
      topicSlugs: topicSlugsFor(title),
      metadata: {
        status: status === "Upcoming" ? "forthcoming" : "open",
        fundingRegion: "United Kingdom",
        openingDate: opening,
        awardMin: amount(fields.get("Minimum award")) ?? null,
        awardMax: amount(fields.get("Maximum award")) ?? null,
        awardCurrency: "GBP",
      },
    }];
  });
  const next = html.match(/<a\s+class="next page-numbers"\s+href="([^"]+)"/i)?.[1];
  return { records, next: next ? decodeEntities(next) : null };
}

export const ukriMedicalResearchSource: OpportunitySourceConnector = {
  id: "ukri-medical-research-council",
  source: { type: "FUNDER", name: "UKRI Medical Research Council", verified: true },
  kind: "grants",
  homepage,
  description: "Current and announced UKRI Medical Research Council grant and fellowship calls, with published closing dates.",
  completeSnapshot: true,
  staleGraceHours: 24,
  intervalMinutes: 360,
  isEnabled: () => true,
  async collect({ fetch, now }) {
    const read = await openPublisher(fetch, homepage);
    const records: OpportunityIngestionRecord[] = [];
    let url: string | null = homepage;
    for (let page = 0; url && page < maxPages; page += 1) {
      const result = mrcFundingPage(await read(url), now);
      records.push(...result.records);
      url = result.next;
    }
    if (url) throw new Error("UKRI's medical call list exceeded the configured page budget");
    return records;
  },
};
