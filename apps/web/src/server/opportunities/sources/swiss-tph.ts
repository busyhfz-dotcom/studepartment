import { classifyPositionTitle, isMedicalText, topicSlugsFor } from "./classify";
import { openPublisher } from "./official-pages";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";
import type { OpportunityIngestionRecord } from "../ingestion";

const homepage = "https://jobs.swisstph.ch/Jobs/2?lang=eng";
const publisher = "https://www.swisstph.ch/en/about/careers";

export function swissTphRecords(html: string): OpportunityIngestionRecord[] {
  const links = Array.from(html.matchAll(/href="(\/Vacancies\/(\d+)\/Description\/2)"[^>]*class="HSTableLinkSubTitle"[^>]*>([\s\S]*?)<\/a>/gi));
  if (!/<title>eRecruiting Swiss TPH Jobs<\/title>/i.test(html) || !links.length) {
    throw new Error("Swiss TPH's public vacancy list was not recognized");
  }
  return links.flatMap(([, path, id, markup]) => {
    const title = htmlToText(markup);
    // Match advertised research tracks, including dual senior/postdoctoral roles.
    const type = /\bpostdoctoral scientist\b/i.test(title) ? "POSTDOC" : classifyPositionTitle(title);
    if (!type || !isMedicalText(title)) return [];
    const sourceUrl = new URL(path, homepage).href;
    return [{
      sourceRecordId: id,
      sourceUrl,
      applicationUrl: sourceUrl,
      type,
      title,
      organization: { name: "Swiss Tropical and Public Health Institute", type: "RESEARCH_INSTITUTE", website: publisher, countryCode: "CH" },
      countryCode: "CH",
      topicSlugs: topicSlugsFor(title),
      metadata: { originalPublisher: "Swiss TPH" },
    }];
  });
}

export const swissTphSource: OpportunitySourceConnector = {
  id: "swiss-tph-research-jobs",
  source: { type: "INSTITUTIONAL_CAREERS", name: "Swiss TPH Careers", verified: true },
  kind: "positions",
  homepage,
  description: "Research roles from the Swiss Tropical and Public Health Institute’s own vacancy list.",
  completeSnapshot: true,
  allowEmptySnapshot: true,
  staleGraceHours: 12,
  intervalMinutes: 180,
  isEnabled: () => true,
  async collect({ fetch }) {
    const page = await openPublisher(fetch, homepage);
    return swissTphRecords(await page(homepage));
  },
};
