import type { OpportunityIngestionRecord } from "../ingestion";
import { englishDate, openPublisher } from "./official-pages";
import { toPositionRecord } from "./positions";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const campuses = [
  { slug: "uc-berkeley", name: "University of California, Berkeley", origin: "https://aprecruit.berkeley.edu", website: "https://www.berkeley.edu", city: "Berkeley" },
  { slug: "ucla", name: "University of California, Los Angeles", origin: "https://recruit.apo.ucla.edu", website: "https://www.ucla.edu", city: "Los Angeles" },
  { slug: "uc-san-diego", name: "University of California, San Diego", origin: "https://apol-recruit.ucsd.edu", website: "https://www.ucsd.edu", city: "San Diego" },
];

export function ucResearchRecords(html: string, campus: typeof campuses[number], today: string): OpportunityIngestionRecord[] {
  const vacancies = Array.from(html.matchAll(/<tr id="(JPF\d+)"[^>]*\bdata-search="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/gi));
  if (!/Browse Open Recruitments/i.test(html) || !vacancies.length) {
    throw new Error("The university's public AP Recruit board was not recognized");
  }
  return vacancies.flatMap(([, id, search, vacancy]) => {
    const title = htmlToText(vacancy.match(/<div class=['"]name['"]>([\s\S]*?)<\/div>/i)?.[1]);
    const window = htmlToText(vacancy.match(/<div class=['"]open-window['"]>([\s\S]*?)<\/div>/i)?.[1]);
    const dates = window.match(/^Open ([A-Za-z]+ \d{1,2}, 20\d{2}) [–—-] ([A-Za-z]+ \d{1,2}, 20\d{2})$/);
    const publishedAt = dates && englishDate(dates[1]);
    const deadline = dates && englishDate(dates[2]);
    if (!publishedAt || !deadline || publishedAt > today || deadline < today || !vacancy.includes('href="/' + id + '"')) return [];
    const subjects = htmlToText(search).split("|").slice(5).filter(Boolean);
    const sourceUrl = campus.origin + "/" + id;
    const record = toPositionRecord({
      sourceRecordId: id,
      sourceUrl,
      applicationUrl: sourceUrl,
      title,
      organization: { name: campus.name, type: "UNIVERSITY", countryCode: "US", website: campus.website },
      city: campus.city,
      countryCode: "US",
      deadline,
      publishedAt,
      subjects,
      requireResearchTitle: true,
    });
    return record ? [{ ...record, deadlineTimezone: "America/Los_Angeles" }] : [];
  });
}

export const californiaResearchCareerSources: OpportunitySourceConnector[] = campuses.map((campus) => {
  const homepage = campus.origin + "/apply";
  return {
    id: campus.slug + "-biomedical-research",
    source: { type: "INSTITUTIONAL_CAREERS", name: campus.name + " Research Careers", verified: true },
    kind: "positions",
    homepage,
    description: "Biomedical research vacancies from the university's open academic recruitments.",
    completeSnapshot: true,
    allowEmptySnapshot: true,
    staleGraceHours: 24,
    intervalMinutes: 360,
    isEnabled: () => true,
    async collect({ fetch, now }) {
      const read = await openPublisher(fetch, homepage);
      return ucResearchRecords(await read(homepage), campus, new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Los_Angeles" }).format(now));
    },
  };
});
