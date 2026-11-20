import type { OpportunityIngestionRecord } from "../ingestion";
import { englishDate, openPublisher } from "./official-pages";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://braincanada.ca/research/funding-opportunities";
const organization = { name: "Brain Canada Foundation", type: "FOUNDATION", countryCode: "CA", website: "https://braincanada.ca/" } as const;
const timezone = "America/Toronto";
const types = { msc: "MASTERS_SCHOLARSHIP", phd: "PHD_SCHOLARSHIP", pdf: "FELLOWSHIP" } as const;
const levels = { msc: "Master’s", phd: "PhD", pdf: "Postdoctoral" } as const;

export function brainCanadaTrainingRecords(html: string, now: Date): OpportunityIngestionRecord[] {
  if (!/Brain Canada Foundation/i.test(html) || !/Funding Opportunities/i.test(html)) {
    throw new Error("Brain Canada's funding list was not recognized");
  }
  const awards = [...html.matchAll(/<p>\s*<strong>(Personnel Awards for [^<]+)<\/strong>\s*<\/p>([\s\S]*?)(?=<div><\/div>|<\/div>)/gi)];
  return awards.flatMap(([, rawTitle, markup]) => {
    const title = htmlToText(rawTitle);
    const details = htmlToText(markup);
    const submitted = details.match(/Application submission deadline:\s*([A-Za-z]+ \d{1,2}, 20\d{2})\s+(\d{1,2}):(\d{2})\s*(A\.?M\.?|P\.?M\.?)\s+ET/i);
    if (!submitted) return [];
    const day = englishDate(submitted[1]);
    const hour = Number(submitted[2]) % 12 + (submitted[4].startsWith("P") ? 12 : 0);
    const minute = Number(submitted[3]);
    if (!day || !hour || minute > 59) return [];
    const offset = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, timeZoneName: "longOffset" })
      .formatToParts(new Date(day + "T12:00:00Z")).find((part) => part.type === "timeZoneName")?.value?.slice(3);
    if (!offset) return [];
    const at = (h: number) => day + "T" + String(h).padStart(2, "0") + ":" + submitted[3] + ":00" + offset;
    const submissionDate = at(hour);
    const earlyRegistration = /registration for the competition closes three hours prior to the submission deadline/i.test(details);
    if (earlyRegistration && hour < 3) return [];
    const deadline = earlyRegistration ? at(hour - 3) : submissionDate;
    if (Date.parse(deadline) <= now.getTime()) return [];
    return [...markup.matchAll(/href="(https:\/\/braincanada\.ca\/files\/([a-z0-9]+)-(msc|phd|pdf)-competition-guidelines-en\.pdf)"/gi)].map(([, sourceUrl, id, level]) => {
      const degree = level.toLowerCase() as keyof typeof types;
      return {
        sourceRecordId: id + "-" + degree + "-" + day.slice(0, 4),
        sourceUrl, applicationUrl: homepage,
        type: types[degree], title: levels[degree] + " " + title,
        description: earlyRegistration ? "The displayed deadline is for mandatory registration. The full application is due three hours later. See the official guidelines for eligibility." : null,
        organization, countryCode: "CA", deadline, deadlineTimezone: timezone,
        topicSlugs: ["cardiovascular-medicine", "neuroscience"],
        metadata: { status: "open", fundingRegion: "Canada", submissionDate },
      };
    });
  });
}

export const brainCanadaTrainingSource: OpportunitySourceConnector = {
  id: "brain-canada-research-training-awards",
  source: { type: "FUNDER", name: "Brain Canada and Heart & Stroke Research Training Awards", verified: true },
  kind: "scholarships",
  homepage,
  description: "Dated master’s, doctoral and postdoctoral research funding from Brain Canada and Heart & Stroke.",
  completeSnapshot: false,
  intervalMinutes: 360,
  isEnabled: () => true,
  async collect({ fetch, now }) {
    const read = await openPublisher(fetch, homepage);
    return brainCanadaTrainingRecords(await read(homepage), now);
  },
};
