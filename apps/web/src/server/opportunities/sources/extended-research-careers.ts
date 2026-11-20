import type { OpportunityIngestionRecord } from "../ingestion";
import { mapWithConcurrency } from "./http";
import { englishDate, openPublisher } from "./official-pages";
import { toPositionRecord } from "./positions";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const pasteur = "https://research.pasteur.fr/en/jobs/";
const berlin = "https://www.mdc-berlin.de/careers/join/positions";
const basel = "https://jobs.unibas.ch/?lang=en";
const capeTown = "https://neuroscience.uct.ac.za/opportunities";
const today = (now: Date) => now.toISOString().slice(0, 10);

export function baselResearchRecords(html: string, now: Date): OpportunityIngestionRecord[] {
  const cards = [...html.matchAll(/<div class="job job-\d+ ui grid">([\s\S]*?)(?=<div class="job job-\d+ ui grid"|<\/main>|<footer)/gi)];
  if (!cards.length || !/Stellenmarkt der Universität Basel/i.test(html)) throw new Error("The University of Basel's careers list was not recognized");
  return cards.flatMap(([, card]) => {
    const link = card.match(/<a class="job-title" href="(https:\/\/jobs\.unibas\.ch\/offene-stellen\/[a-z0-9-]+\/([a-f0-9-]{36}))"[^>]*>([\s\S]*?)<\/a>/i);
    const published = card.match(/class="job-date">\s*(\d{2})\.(\d{2})\.(20\d{2})\s*</i);
    if (!link || !published) return [];
    const publishedAt = [published[3], published[2], published[1]].join("-");
    const age = now.getTime() - Date.parse(publishedAt);
    if (age > 75 * 86_400_000 || age < -86_400_000) return [];
    const record = toPositionRecord({
      sourceRecordId: link[2], sourceUrl: link[1], applicationUrl: link[1], title: htmlToText(link[3]),
      organization: { name: "University of Basel", type: "UNIVERSITY", website: "https://www.unibas.ch/", countryCode: "CH" },
      countryCode: "CH", city: "Basel", publishedAt,
    });
    return record ? [record] : [];
  });
}

export function capeTownResearchRecords(html: string, now: Date): OpportunityIngestionRecord[] {
  const cards = [...html.matchAll(/<li class="(?:is-active )?accordion-item" data-accordion-item="">([\s\S]*?)(?=<li class="(?:is-active )?accordion-item"|<\/ul>\s*<\/div>)/gi)];
  if (!cards.length || !/Opportunities \| Neuroscience Institute/i.test(html)) throw new Error("The UCT Neuroscience Institute's noticeboard was not recognized");
  return cards.flatMap(([, card]) => {
    const title = htmlToText(card.match(/<h3 class="node__title">([\s\S]*?)<\/h3>/i)?.[1]);
    const label = htmlToText(card).match(/Closing date for applications:\s*(\d{1,2} [A-Za-z]+ 20\d{2})/i)?.[1];
    const deadline = label ? englishDate(label) : null;
    const pdf = card.match(/href="(\/sites\/default\/files\/[a-z0-9/_-]+\.pdf)" type="application\/pdf"/i)?.[1];
    if (!title || !pdf || !deadline || deadline < today(now)) return [];
    const sourceUrl = new URL(pdf, capeTown).href;
    const record = toPositionRecord({
      sourceRecordId: pdf, sourceUrl, applicationUrl: sourceUrl, title,
      organization: { name: "University of Cape Town Neuroscience Institute", type: "UNIVERSITY", website: "https://neuroscience.uct.ac.za/", countryCode: "ZA" },
      countryCode: "ZA", city: "Cape Town", deadline, biomedicalPublisher: true, requireResearchTitle: true,
    });
    return record ? [{ ...record, deadlineTimezone: "Africa/Johannesburg" }] : [];
  });
}

export const extendedResearchSources: OpportunitySourceConnector[] = [
  {
    id: "university-of-basel-health-research",
    source: { type: "INSTITUTIONAL_CAREERS", name: "University of Basel Research Careers", verified: true },
    kind: "positions", homepage: basel,
    description: "Recent biomedical doctoral, research and postdoctoral roles from the University of Basel.",
    completeSnapshot: true, staleGraceHours: 24, intervalMinutes: 360, isEnabled: () => true,
    async collect({ fetch, now }) {
      const read = await openPublisher(fetch, basel);
      return baselResearchRecords(await read(basel), now);
    },
  },
  {
    id: "uct-neuroscience-careers",
    source: { type: "INSTITUTIONAL_CAREERS", name: "University of Cape Town Neuroscience Careers", verified: true },
    kind: "positions", homepage: capeTown,
    description: "Dated neuroscience research openings directly from the University of Cape Town.",
    completeSnapshot: false, intervalMinutes: 360, isEnabled: () => true,
    async collect({ fetch, now }) {
      const read = await openPublisher(fetch, capeTown);
      return capeTownResearchRecords(await read(capeTown), now);
    },
  },
  {
    id: "pasteur-institute-research-careers",
    source: { type: "INSTITUTIONAL_CAREERS", name: "Institut Pasteur Research Careers", verified: true },
    kind: "positions", homepage: pasteur,
    description: "Dated research vacancies from Institut Pasteur research teams in France.",
    completeSnapshot: false, intervalMinutes: 360, isEnabled: () => true,
    async collect({ fetch, now }) {
      const read = await openPublisher(fetch, pasteur);
      const html = await read(pasteur);
      const cards = [...html.matchAll(/<article id="post-(\d+)"[^>]*class="[^"]+\btype-job\b[^"]*"[^>]*>([\s\S]*?)<\/article>/gi)];
      if (!cards.length) throw new Error("Institut Pasteur's research vacancy cards were not recognized");
      const candidates = cards.flatMap(([, id, card]) => {
        const sourceUrl = card.match(/href="(https:\/\/research\.pasteur\.fr\/en\/job\/[a-z0-9-]+\/)"/i)?.[1];
        const title = htmlToText(card.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1]);
        const role = htmlToText(card.match(/<div class="label">([\s\S]*?)<\/div>/i)?.[1]);
        return sourceUrl && title && /Post-doc|PhD student|Research Assistant/i.test(role) ? [{ id, sourceUrl, title, role }] : [];
      }).slice(0, 8);
      const checked = await mapWithConcurrency(candidates, 2, async (item) => {
        const detail = await read(item.sourceUrl);
        const date = detail.match(/Application Deadline<\/div>\s*<div class="b-text">(\d{1,2})<\/div>\s*<div class="s-text">([A-Za-z]+ 20\d{2})<\/div>/i);
        const deadline = date ? englishDate(date[1] + " " + date[2]) : null;
        if (!deadline || deadline < today(now)) return null;
        const extra = /\b(?:post-?doc\w*|ph\.?d|research assistant)\b/i.test(item.title) ? "" : item.role.replace(/^Job:\s*/i, "") + " — ";
        const record = toPositionRecord({
          sourceRecordId: item.id, sourceUrl: item.sourceUrl, applicationUrl: item.sourceUrl, title: extra + item.title,
          organization: { name: "Institut Pasteur", type: "RESEARCH_INSTITUTE", website: "https://www.pasteur.fr/", countryCode: "FR" },
          countryCode: "FR", city: "Paris", deadline, biomedicalPublisher: true,
        });
        return record && { ...record, deadlineTimezone: "Europe/Paris" };
      });
      return checked.filter((row): row is NonNullable<typeof row> => Boolean(row));
    },
  },
  {
    id: "max-delbruck-center-research-careers",
    source: { type: "INSTITUTIONAL_CAREERS", name: "Max Delbrück Center Research Careers", verified: true },
    kind: "positions", homepage: berlin,
    description: "Open postdoctoral and doctoral appointments from Germany’s Max Delbrück Center.",
    completeSnapshot: false, intervalMinutes: 360, isEnabled: () => true,
    async collect({ fetch, now }) {
      const read = await openPublisher(fetch, berlin);
      const html = await read(berlin);
      const cards = [...html.matchAll(/<a class="link-card link-card--list" href="(\/career\/jobs\/[a-z0-9-]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
      if (!cards.length) throw new Error("Max Delbrück Center's recruitment list was not recognized");
      const records = [];
      for (const [, path, card] of cards.slice(0, 10)) {
        const title = htmlToText(card.match(/<span><span>([\s\S]*?)<\/span><\/span>/i)?.[1]);
        if (!/\b(?:postdoc\w*|ph\.?d|doctoral|research assistant)\b/i.test(title)) continue;
        const sourceUrl = new URL(path, berlin).href;
        const detail = await read(sourceUrl);
        const date = htmlToText(detail.match(/<strong>Application Period<\/strong>\s*<div>([\s\S]*?)<\/div>/i)?.[1]);
        const deadline = date ? englishDate(date) : null;
        if (!deadline || deadline < today(now)) continue;
        const record = toPositionRecord({
          sourceRecordId: path, sourceUrl, applicationUrl: sourceUrl, title,
          organization: { name: "Max Delbrück Center for Molecular Medicine", type: "RESEARCH_INSTITUTE", website: "https://www.mdc-berlin.de/", countryCode: "DE" },
          countryCode: "DE", city: "Berlin", deadline, biomedicalPublisher: true,
        });
        if (record) records.push({ ...record, deadlineTimezone: "Europe/Berlin" });
      }
      return records;
    },
  },
];
