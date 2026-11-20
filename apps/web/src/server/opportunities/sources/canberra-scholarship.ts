import type { OpportunityIngestionRecord } from "../ingestion";
import { openPublisher } from "./official-pages";
import { htmlToText } from "./text";
import type { OpportunitySourceConnector } from "./types";

const homepage = "https://www.canberra.edu.au/scholarship/uc-southeast-asia-excellence";
const publicHealthCourse = "https://www.canberra.edu.au/future-students/study-at-uc/about-our-courses/master-of-public-health";
const countryCodes = {
  Brunei: "BN", Cambodia: "KH", Indonesia: "ID", Laos: "LA", Malaysia: "MY",
  Philippines: "PH", Singapore: "SG", Thailand: "TH", "Viet Nam": "VN",
};

export function canberraScholarships(awardHtml: string, courseHtml: string): OpportunityIngestionRecord[] {
  const award = htmlToText(awardHtml);
  const course = htmlToText(courseHtml);
  const eligibility = award.match(/Scholarship is available to students from:\s*(.*?)\s*Eligible courses:/i)?.[1];
  const exclusions = award.match(/Following courses:\s*(.*?)\s*Academic achievement requirements/i)?.[1];
  if (!eligibility || !exclusions || !/Level of study\s*Undergraduate, Postgraduate/i.test(award)) {
    throw new Error("Canberra's published eligibility list was not recognized");
  }
  const countries = Object.entries(countryCodes).filter(([name]) => eligibility.includes(name)).map(([, code]) => code);
  const rolling = /\bOpen\s+Always Open\b/i.test(award);
  const tuition = award.match(/Value of Scholarship\s*(\d+)% off Tuition Fees/i)?.[1];
  const coversPublicHealth = /The Master of Public Health \(Extended\) course also meets the academic entry requirements for international student/i.test(course)
    && !exclusions.includes("Master of Public Health");
  return [{
    sourceRecordId: "uc-southeast-asia-excellence",
    sourceUrl: homepage,
    applicationUrl: homepage,
    type: "MASTERS_SCHOLARSHIP",
    title: "University of Canberra Southeast Asia Excellence Scholarship",
    description: `A tuition award for eligible applicants from participating Southeast Asian countries. The published reduction is ${tuition ?? "listed on the scholarship page"}${tuition ? "%" : ""}. International applicants can explore the Master of Public Health (Extended) and check course exclusions before applying. The university assesses scholarship eligibility during the admissions process.`,
    organization: { name: "University of Canberra", type: "UNIVERSITY", countryCode: "AU", website: new URL(homepage).origin },
    countryCode: "AU",
    deadline: rolling ? "rolling" : null,
    eligibleCareerStages: ["student"],
    eligibleCountryCodes: countries,
    topicSlugs: ["public-health"],
    status: rolling && coversPublicHealth && countries.length > 0 && tuition ? "ACTIVE" : "CLOSED",
    metadata: { degreeFunding: true, courseUrl: publicHealthCourse },
  }];
}

export const canberraScholarshipSource: OpportunitySourceConnector = {
  id: "canberra-southeast-asia-scholarship",
  source: { type: "FUNDER", name: "University of Canberra Scholarships", verified: true },
  kind: "scholarships",
  homepage,
  description: "The university’s regional tuition scholarship, with a verified public health master's study option.",
  completeSnapshot: true,
  intervalMinutes: 360,
  isEnabled: () => true,
  async collect({ fetch }) {
    const page = await openPublisher(fetch, homepage);
    return canberraScholarships(await page(homepage), await page(publicHealthCourse));
  },
};
