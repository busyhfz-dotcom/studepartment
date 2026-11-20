import type { OpportunityIngestionRecord } from "../ingestion";
import { openPublisher } from "./official-pages";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://www.lifearc.org/project/rare-disease-clinical-trials-programme/";

export function lifeArcRecords(html: string): OpportunityIngestionRecord[] {
  const page = htmlToText(html);
  const title = "Rare Disease Clinical Trials Programme";
  if (!page.includes(title)) throw new Error("LifeArc's programme page was not recognized");
  const status = page.match(/\bStatus:\s*(Open for applications|Closed for applications|Applications closed|Closed)\b/i)?.[1];
  if (!status) throw new Error("LifeArc's published application status was not recognized");
  const international = /either in the UK or abroad/i.test(page);
  const amount = page.match(/can request up to £([\d.]+) million per proposal\b/i)?.[1];
  return [{
    sourceRecordId: "rare-disease-clinical-trials-programme",
    sourceUrl: homepage,
    applicationUrl: homepage,
    type: "GRANT",
    title,
    description: "Clinical-development funding for rare disease research. See the funder’s eligibility and expression-of-interest process.",
    organization: { name: "LifeArc", type: "FOUNDATION", countryCode: "GB", website: "https://www.lifearc.org" },
    topicSlugs: ["rare-diseases", "clinical-trials"],
    status: status.toLowerCase() === "open for applications" ? "ACTIVE" : "CLOSED",
    metadata: {
      status: status.toLowerCase() === "open for applications" ? "open" : "closed",
      ...(international ? { eligibilityRegion: "United Kingdom and international" } : {}),
      ...(amount ? { awardMax: Number(amount) * 1_000_000, awardCurrency: "GBP" } : {}),
    },
  }];
}

export const lifeArcSource: OpportunitySourceConnector = {
  id: "lifearc-rare-disease-funding",
  source: { type: "FUNDER", name: "LifeArc", verified: true },
  kind: "grants",
  homepage,
  description: "LifeArc’s Rare Disease Clinical Trials Programme, checked against the funder’s published application status.",
  completeSnapshot: true,
  intervalMinutes: 360,
  isEnabled: () => true,
  async collect({ fetch }) {
    const page = await openPublisher(fetch, homepage);
    return lifeArcRecords(await page(homepage));
  },
};
