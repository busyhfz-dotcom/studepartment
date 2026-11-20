import type { OpportunityIngestionRecord } from "../ingestion";
import { openPublisher } from "./official-pages";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://en.ritsumei.ac.jp/admissions/monbukagakusho-university-recommendation/";
const guidelines = "/admissions-e/file/RU_LifeSci_MEXTUniRecAppGuidelines.pdf";
// Verify the degree levels and exact time against the published guidelines for
// each intake. The university reuses the PDF URL, and eligibility can change.
const intake = {
  year: 2027,
  publishedPeriod: "Nov 17 - Nov 26",
  opens: "2026-11-17T00:00:00+09:00",
  deadline: "2026-11-26T23:59:00+09:00",
  degrees: ["MASTERS_SCHOLARSHIP", "PHD_SCHOLARSHIP"] as const,
};

export function ritsumeikanScholarships(html: string, now: Date): OpportunityIngestionRecord[] {
  const publicMarkup = html.replace(/<!--[\s\S]*?-->/g, "");
  const school = Array.from(publicMarkup.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi))
    .find(([, item]) => item.includes(guidelines) && /GRADUATE SCHOOL OF LIFE SCIENCES/i.test(item));
  if (!school) throw new Error("Ritsumeikan's Life Sciences guidelines were not found");
  const text = htmlToText(school[1]);
  const year = Number(text.match(/September\s+(20\d{2})\s+Enrollment/i)?.[1]);
  if (year !== intake.year || !text.includes(intake.publishedPeriod)) {
    throw new Error("Ritsumeikan published a different intake or application period that needs verification");
  }
  if (now.getTime() < Date.parse(intake.opens) || now.getTime() > Date.parse(intake.deadline)) return [];

  return intake.degrees.map((type) => ({
    sourceRecordId: `life-sciences-${intake.year}:${type}`,
    sourceUrl: homepage,
    applicationUrl: homepage,
    type,
    title: `MEXT University Recommendation – Ritsumeikan Life Sciences (${intake.year})`,
    description: `Apply to Ritsumeikan University’s Graduate School of Life Sciences for a ${type === "MASTERS_SCHOLARSHIP" ? "master’s degree" : "doctorate"} and nomination for Japanese government funding. The university’s intake instructions explain the admission and nomination process. MEXT makes the final funding decision.`,
    organization: { name: "Ritsumeikan University", type: "UNIVERSITY", website: "https://en.ritsumei.ac.jp", countryCode: "JP" },
    countryCode: "JP",
    deadline: intake.deadline,
    deadlineTimezone: "Asia/Tokyo",
    eligibleCareerStages: [type === "MASTERS_SCHOLARSHIP" ? "student" : "phd"],
    metadata: { degreeFunding: true, applicationCycle: intake.year, guidelinesUrl: new URL(guidelines, homepage).href },
  }));
}

export const ritsumeikanScholarshipSource: OpportunitySourceConnector = {
  id: "ritsumeikan-mext-life-sciences",
  source: { type: "FUNDER", name: "Ritsumeikan University Scholarships", verified: true },
  kind: "scholarships",
  homepage,
  description: "Ritsumeikan’s own Life Sciences intake for MEXT university nominations, with a verified university application window.",
  completeSnapshot: true,
  intervalMinutes: 360,
  isEnabled: () => true,
  async collect({ fetch, now }) {
    const page = await openPublisher(fetch, homepage);
    return ritsumeikanScholarships(await page(homepage), now);
  },
};
