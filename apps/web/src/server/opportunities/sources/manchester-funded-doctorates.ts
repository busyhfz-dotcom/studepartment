import type { OpportunityIngestionRecord } from "../ingestion";
import { isMedicalText, topicSlugsFor } from "./classify";
import { englishDate, openPublisher } from "./official-pages";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://www.bmh.manchester.ac.uk/study/research/funding-fees/funded-programmes/";

export function manchesterDoctoralProgrammes(html: string, now: Date): OpportunityIngestionRecord[] {
  const cards = [...html.matchAll(/<li id="d\.en\.\d+" data-filter1="(open|closed|reopening)">\s*<a href="([^"]+)"[^>]*>([\s\S]*?)<\/li>/gi)];
  if (!cards.length) throw new Error("Manchester's doctoral funding list was not recognized");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(now);
  return cards.flatMap(([, state, href, card]) => {
    if (state === "closed" || !href.startsWith("/study/research/funding-fees/funded-programmes/")) return [];
    const title = htmlToText(card.match(/<h3>([\s\S]*?)<\/h3>/i)?.[1]);
    const text = htmlToText(card.match(/<div><p>([\s\S]*?)<\/div>/i)?.[1]);
    const schedule = text.match(/Applications open for (\d{4}\/\d{2}) entry from (\d{1,2} [A-Za-z]+ 20\d{2})/i);
    const opening = schedule ? englishDate(schedule[2]) : null;
    if (!title || !isMedicalText(title, text) || !/\b(fully funded|scholarship|phd studentship)\w*\b/i.test(text)) return [];
    if (state === "reopening" && !opening) return [];
    if (state === "open" && !/applications now open/i.test(text)) return [];
    const sourceUrl = new URL(href, homepage).href;
    const upcoming = Boolean(opening && opening > today);
    return [{
      sourceRecordId: href.split("/").filter(Boolean).at(-1)!,
      sourceUrl,
      applicationUrl: sourceUrl,
      type: "PHD_SCHOLARSHIP",
      title,
      description: upcoming
        ? `Manchester lists this funded doctoral programme as opening on ${opening}. Check the university for eligibility and application details.`
        : "Funded doctoral training listed by the University of Manchester Faculty of Biology, Medicine and Health. See the programme for projects and application deadlines.",
      organization: { name: "University of Manchester", type: "UNIVERSITY", website: "https://www.manchester.ac.uk", countryCode: "GB" },
      countryCode: "GB",
      city: "Manchester",
      topicSlugs: topicSlugsFor(title + " " + text),
      status: "ACTIVE",
      metadata: { degreeFunding: true, status: upcoming ? "forthcoming" : "open", openingDate: opening },
    }];
  });
}

export const manchesterFundedDoctoratesSource: OpportunitySourceConnector = {
  id: "manchester-funded-doctorates",
  source: { type: "FUNDER", name: "University of Manchester funded doctoral programmes", verified: true },
  kind: "scholarships",
  homepage,
  description: "Official listings of open and announced funded doctoral programmes in biology, medicine and health.",
  completeSnapshot: true,
  allowEmptySnapshot: true,
  intervalMinutes: 720,
  staleGraceHours: 24,
  isEnabled: () => true,
  async collect({ fetch, now, log }) {
    const read = await openPublisher(fetch, homepage);
    const records = manchesterDoctoralProgrammes(await read(homepage), now);
    log(`Manchester doctoral funding: ${records.length} programmes`);
    return records;
  },
};
