import type { OpportunityIngestionRecord } from "../ingestion";
import { englishDate, openPublisher } from "./official-pages";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://www.rmit.edu.au/scholarships/research/phd-scholarship-in-medical-science";
const title = "RMIT PhD Scholarship in Medical Science";

export function rmitMedicalScienceRecords(html: string, now: Date): OpportunityIngestionRecord[] {
  const text = htmlToText(html);
  if (!/PhD Scholarship in Medical Science/i.test(text)) throw new Error("RMIT's Medical Science scholarship page was not recognized");
  if (!/Opening date\s+Applications open now\b/i.test(text)) return [];
  const date = text.match(/Clos(?:ing|e) date\s+(\d{1,2}(?:st|nd|rd|th)? \w+ 20\d{2})/i)?.[1];
  const deadline = date ? englishDate(date) : null;
  if (!deadline) throw new Error("RMIT did not publish a recognizable medical science deadline");
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Australia/Melbourne", dateStyle: "short" }).format(now);
  if (deadline < today) return [];

  return [{
    sourceRecordId: "phd-medical-science",
    sourceUrl: homepage,
    applicationUrl: homepage,
    type: "PHD_SCHOLARSHIP",
    title,
    description: "Doctoral funding for a medical science research project at RMIT University. The official opportunity page provides project details, applicant requirements and instructions.",
    organization: { name: "RMIT University", type: "UNIVERSITY", countryCode: "AU", website: "https://www.rmit.edu.au" },
    countryCode: "AU",
    deadline,
    deadlineTimezone: "Australia/Melbourne",
    eligibleCareerStages: ["phd"],
    metadata: { degreeFunding: true },
  }];
}

export const rmitMedicalScienceSource: OpportunitySourceConnector = {
  id: "rmit-medical-science-phd",
  source: { type: "FUNDER", name: "RMIT Medical Science Scholarships", verified: true },
  kind: "scholarships",
  homepage,
  description: "RMIT’s Medical Science PhD scholarship while the university lists applications as open.",
  completeSnapshot: true,
  allowEmptySnapshot: true,
  intervalMinutes: 360,
  isEnabled: () => true,
  async collect({ fetch, now }) {
    const page = await openPublisher(fetch, homepage);
    return rmitMedicalScienceRecords(await page(homepage), now);
  },
};
