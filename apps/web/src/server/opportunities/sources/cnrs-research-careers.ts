import type { OpportunityIngestionRecord } from "../ingestion";
import { classifyPositionTitle, isMedicalText, topicSlugsFor } from "./classify";
import { mapWithConcurrency } from "./http";
import { openPublisher } from "./official-pages";
import { deadlineFromText } from "./positions";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://emploi.cnrs.fr/Offres/Recherche.aspx?lang=EN";
const medicalFrench = /biochimie|biophysi|bioinformat|biom[ée]d|sant[ée]|m[ée]decine|neuroscien|neurobiol|immunol|oncolog|cancer|biologie (?:cellulaire|mol[ée]culaire)|(?:pathologie|[ée]pid[ée]miologie)/i;

export function cnrsCards(html: string) {
  const cards = Array.from(html.matchAll(/<h3 class="h5"><a href="(\/Offres\/(?:CDD|Doctorant)\/([A-Z0-9-]+)\/Default\.aspx)">([\s\S]*?)<\/a><\/h3>[\s\S]*?<div class="meta meta-borderless">([\s\S]*?)<\/div>/gi));
  if (!cards.length || !/Our job offers/i.test(html)) throw new Error("CNRS's recent job listings were not recognized");
  return cards.flatMap(([, path, id, markup, metadata]) => {
    const title = htmlToText(markup);
    const context = htmlToText(metadata);
    if (!medicalFrench.test(`${title} ${context}`) && !isMedicalText(title, context)) return [];
    const type = classifyPositionTitle(title)
      ?? (/\bpost[ -]?doctor(?:ant|al|at)/i.test(title) ? "POSTDOC" : null)
      ?? (/^Ing[ée]nieur (?:d['’][ée]tudes|de Recherche)\b/i.test(title) ? "RESEARCH_ASSISTANTSHIP" : null);
    return type ? [{ path, id, title, type, context }] : [];
  });
}

export const cnrsResearchCareersSource: OpportunitySourceConnector = {
  id: "cnrs-biomedical-research",
  source: { type: "INSTITUTIONAL_CAREERS", name: "CNRS Biomedical Research Careers", verified: true },
  kind: "positions",
  homepage,
  description: "Recent health-related research posts from the official French CNRS recruitment portal.",
  completeSnapshot: false,
  intervalMinutes: 360,
  isEnabled: () => true,
  async collect({ fetch, now }) {
    const read = await openPublisher(fetch, homepage);
    const cards = cnrsCards(await read(homepage));
    const records = await mapWithConcurrency(cards.slice(0, 12), 2, async (card): Promise<OpportunityIngestionRecord | null> => {
      const sourceUrl = new URL(card.path, homepage).href;
      const detail = htmlToText(await read(sourceUrl + "?lang=EN"));
      const deadline = deadlineFromText(detail, now);
      if (!deadline || Date.parse(deadline) + 86_400_000 < now.getTime()) return null;
      return {
        sourceRecordId: card.id,
        sourceUrl,
        applicationUrl: sourceUrl,
        type: card.type,
        title: card.title,
        organization: { name: "CNRS", type: "RESEARCH_INSTITUTE", website: "https://www.cnrs.fr/en", countryCode: "FR" },
        countryCode: "FR",
        deadline,
        deadlineTimezone: "Europe/Paris",
        topicSlugs: topicSlugsFor(`${card.title} ${card.context}`),
      };
    });
    return records.filter((record): record is OpportunityIngestionRecord => record !== null);
  },
};
