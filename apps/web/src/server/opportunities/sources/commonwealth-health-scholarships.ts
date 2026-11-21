import type { OpportunityIngestionRecord } from "../ingestion";
import { isMedicalText, topicSlugsFor } from "./classify";
import { englishDate, openPublisher } from "./official-pages";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const applications = "https://cscuk.fcdo.gov.uk/scholarships/commonwealth-shared-scholarships-applications/";
const eligibleCourses = "https://cscuk.fcdo.gov.uk/commonwealth-shared-scholarships-eligible-courses/";

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function commonwealthHealthScholarships(applicationPage: string, coursePage: string, now: Date): OpportunityIngestionRecord[] {
  const applicationText = htmlToText(applicationPage);
  const year = applicationText.match(/Commonwealth Shared Scholarships for the (20\d{2})\/\d{2} academic year are now open/i)?.[1];
  const close = applicationText.match(/closing date for applications is (\d{2}:\d{2}) GMT on (?:[A-Za-z]+ )?(\d{1,2} [A-Za-z]+ 20\d{2})/i);
  if (!year || !close) {
    if (/applications.*(?:are|now) closed|round.*closed for applications/i.test(applicationText)) return [];
    throw new Error("The Commonwealth scholarship application window was not recognized");
  }
  const day = englishDate(close[2]);
  if (!day) throw new Error("The Commonwealth scholarship deadline was not recognized");
  const deadline = `${day}T${close[1]}:00Z`;
  if (Date.parse(deadline) <= now.getTime()) return [];
  if (!htmlToText(coursePage).includes(`Commonwealth Shared Scholarships ${year} Eligible courses`)) throw new Error("The eligible courses page is from a different academic year");

  const tables = [...coursePage.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)];
  if (tables.length < 4) throw new Error("The official eligible courses tables were not recognized");
  const records = new Map<string, OpportunityIngestionRecord>();
  for (const [, table] of tables) for (const [, row] of table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(([, cell]) => htmlToText(cell));
    if (cells.length !== 2) continue;
    const [university, course] = cells;
    if (!university || !/^(MSc|MRes|MPhil|MPH|MA|LLM)\b/i.test(course) || !isMedicalText(course)) continue;
    if (/^MSc (?:Wild Animal|Veterinary)\b/i.test(course)) continue;
    const id = `${year}-${slug(university)}-${slug(course)}`;
    records.set(id, {
      sourceRecordId: id,
      sourceUrl: eligibleCourses,
      applicationUrl: applications,
      title: `Commonwealth Shared Scholarship · ${course} · ${university}`,
      type: "MASTERS_SCHOLARSHIP",
      description: "This course is on the Commonwealth Scholarship Commission's eligible list. Review the official application and country eligibility requirements and apply for admission to the university separately.",
      organization: { name: university, type: "UNIVERSITY", countryCode: "GB" },
      countryCode: "GB",
      deadline,
      deadlineTimezone: "Europe/London",
      topicSlugs: topicSlugsFor(course),
      status: "ACTIVE",
    });
  }
  return [...records.values()];
}

export const commonwealthMedicalMastersSource: OpportunitySourceConnector = {
  id: "commonwealth-shared-health-masters",
  source: { type: "FUNDER", name: "Commonwealth Shared Scholarships eligible health courses", verified: true },
  kind: "scholarships",
  homepage: eligibleCourses,
  description: "Health and biomedical master's courses with an open Commonwealth Shared Scholarship application window.",
  completeSnapshot: true,
  allowEmptySnapshot: true,
  intervalMinutes: 720,
  staleGraceHours: 24,
  isEnabled: () => true,
  async collect({ fetch, now }) {
    const read = await openPublisher(fetch, eligibleCourses);
    const [status, list] = await Promise.all([read(applications), read(eligibleCourses)]);
    return commonwealthHealthScholarships(status, list, now);
  },
};
