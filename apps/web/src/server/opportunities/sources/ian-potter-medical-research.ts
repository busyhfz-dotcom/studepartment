import type { OpportunityIngestionRecord } from "../ingestion";
import { englishDate, openPublisher } from "./official-pages";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://www.ianpotter.org.au/what-we-support/program-areas/medical-research";

export function ianPotterMedicalResearchRecords(html: string, now: Date): OpportunityIngestionRecord[] {
  const page = htmlToText(html);
  const timetable = page.match(/Applications\s+Open \w+ (\d{1,2} \w+ 20\d{2})\s+Close \w+ (\d{1,2} \w+ 20\d{2}),?\s+(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\s+(AES[DT]|AEDT)/i);
  if (!timetable || !/Medical Research/i.test(page)) throw new Error("The Ian Potter Foundation's Medical Research timetable was not recognized");
  const [, opens, closes, hour, minute = "00", half, zone] = timetable;
  const opensOn = englishDate(opens);
  const closesOn = englishDate(closes);
  const rawHour = Number(hour);
  if (!opensOn || !closesOn || opensOn >= closesOn || rawHour < 1 || rawHour > 12 || Number(minute) > 59) {
    throw new Error("The Ian Potter Foundation published an invalid grant window");
  }
  const hours = String(rawHour % 12 + (half.toUpperCase() === "PM" ? 12 : 0)).padStart(2, "0");
  const deadline = `${closesOn}T${hours}:${minute}:00${zone.toUpperCase() === "AEDT" ? "+11:00" : "+10:00"}`;
  if (Date.parse(deadline) < now.getTime()) return [];
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Australia/Melbourne", dateStyle: "short" }).format(now);
  const upcoming = today < opensOn;
  const amount = page.match(/minimum grant amount is \$([\d,]+)/i)?.[1]?.replaceAll(",", "");
  const year = closesOn.slice(0, 4);
  return [{
    sourceRecordId: `medical-research-${year}`,
    sourceUrl: homepage,
    applicationUrl: homepage,
    type: "GRANT",
    title: `The Ian Potter Foundation Medical Research Grant (${year})`,
    description: `Funding for medical research infrastructure. See the foundation’s rules for eligible Australian institutions and application limits.${upcoming ? ` Applications open ${opensOn}.` : ""}`,
    organization: { name: "The Ian Potter Foundation", type: "FOUNDATION", website: "https://www.ianpotter.org.au", countryCode: "AU" },
    countryCode: "AU",
    deadline,
    deadlineTimezone: "Australia/Melbourne",
    metadata: { status: upcoming ? "forthcoming" : "open", eligibilityRegion: "Australia", openingDate: opensOn, awardMin: amount, awardCurrency: "AUD" },
  }];
}

export const ianPotterMedicalResearchSource: OpportunitySourceConnector = {
  id: "ian-potter-medical-research",
  source: { type: "FUNDER", name: "The Ian Potter Foundation", verified: true },
  kind: "grants",
  homepage,
  description: "The Australian foundation’s published Medical Research funding round, with announced and open status shown separately.",
  completeSnapshot: true,
  intervalMinutes: 360,
  isEnabled: () => true,
  async collect({ fetch, now }) {
    const page = await openPublisher(fetch, homepage);
    return ianPotterMedicalResearchRecords(await page(homepage), now);
  },
};
