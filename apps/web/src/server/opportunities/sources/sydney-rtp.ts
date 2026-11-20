import type { OpportunityIngestionRecord } from "../ingestion";
import { englishDate, openPublisher } from "./official-pages";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://www.sydney.edu.au/scholarships/australian-government-research-training-program/rtp-international.html";
const faculty = "https://www.sydney.edu.au/scholarships/international/postgraduate-research/faculty/medicine-health.html";

export function sydneyRtpRecords(scholarshipHtml: string, facultyHtml: string, now: Date): OpportunityIngestionRecord[] {
  const scheme = htmlToText(scholarshipHtml);
  if (!/RTP Stipend Scholarship/i.test(scheme) || !/higher degree by research/i.test(scheme)
      || !/Medicine and health international research scholarships/i.test(htmlToText(facultyHtml))) {
    throw new Error("Sydney's international research scholarship pages were not recognized");
  }
  const tables = Array.from(scholarshipHtml.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi));
  const table = tables.find(([markup]) => /Commencing research period.*Submission deadline/i.test(htmlToText(markup)))?.[0];
  if (!table) throw new Error("Sydney's scholarship submission timetable was not recognized");

  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Australia/Sydney", dateStyle: "short" }).format(now);
  const dates = Array.from(table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi))
    .flatMap(([, row]) => {
      const cells = Array.from(row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi), ([, cell]) => htmlToText(cell));
      if (!/^Research Period\s+[1-4]\s+and\s+[1-4],\s+20\d{2}$/i.test(cells[0] ?? "")) return [];
      if (!/^\d{1,2} [A-Z][a-z]+ 20\d{2}$/.test(cells[1] ?? "")) return [];
      const deadline = englishDate(cells[1]);
      return deadline ? [{ intake: cells[0], deadline }] : [];
    });
  if (!dates.length) throw new Error("Sydney published no recognizable dated research intakes");
  const next = dates.filter((row) => row.deadline >= today).sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
  if (!next) return [];

  // The university's RTP stipend terms cover both Research Masters and Research Doctorates.
  return (["MASTERS_SCHOLARSHIP", "PHD_SCHOLARSHIP"] as const).map((type) => ({
    sourceRecordId: `sydney-rtp-international:${type}`,
    sourceUrl: homepage,
    applicationUrl: homepage,
    type,
    title: "University of Sydney International RTP Scholarship",
    description: `International funding for ${type === "MASTERS_SCHOLARSHIP" ? "research master’s" : "doctoral"} study, with preference given to PhD applicants. Related university awards share the application process. Next published cutoff: ${next.intake}. See the university for Medicine and Health research options and eligibility.`,
    organization: { name: "University of Sydney", type: "UNIVERSITY", website: "https://www.sydney.edu.au", countryCode: "AU" },
    countryCode: "AU",
    deadline: next.deadline,
    deadlineTimezone: "Australia/Sydney",
    eligibleCareerStages: [type === "MASTERS_SCHOLARSHIP" ? "student" : "phd"],
    metadata: { degreeFunding: true, intake: next.intake, facultyUrl: faculty },
  }));
}

export const sydneyRtpSource: OpportunitySourceConnector = {
  id: "sydney-rtp-international",
  source: { type: "FUNDER", name: "University of Sydney Research Scholarships", verified: true },
  kind: "scholarships",
  homepage,
  description: "The University of Sydney’s next international research scholarship cutoff, including eligible Medicine and Health degrees.",
  completeSnapshot: true,
  intervalMinutes: 360,
  isEnabled: () => true,
  async collect({ fetch, now }) {
    const page = await openPublisher(fetch, homepage);
    return sydneyRtpRecords(await page(homepage), await page(faculty), now);
  },
};
