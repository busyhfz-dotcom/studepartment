import type { OpportunityIngestionRecord } from "../ingestion";
import { topicSlugsFor } from "./classify";
import { mapWithConcurrency } from "./http";
import { programmePagePublished } from "./programme-registry";
import type { OpportunitySourceConnector } from "./types";

const academy = "https://acmedsci.ac.uk/grants-and-programmes/grants";
const kmu = "https://enroll.kmu.edu.tw";
const nihr = "https://sphr.nihr.ac.uk/prevention";
const barts = "https://www.bartscharity.org.uk";

type Round = OpportunityIngestionRecord & {
  evidence?: readonly { url: string; match: string }[];
  reviewedOn?: string;
  deadline: string;
  opens?: string;
};

const taiwanScholarship = {
  sourceUrl: kmu + "/scholarships/",
  applicationUrl: kmu + "/admission-application/",
  organization: { name: "Kaohsiung Medical University", type: "UNIVERSITY", website: kmu, countryCode: "TW" },
  countryCode: "TW",
  deadline: "2027-03-15T17:00:00+08:00",
  opens: "2026-12-28T09:00:00+08:00",
  evidence: [
    { url: kmu + "/scholarships/", match: "KMU International Student Scholarship" },
    { url: kmu + "/admission-application/", match: "March 15, 2027, 17:00" },
  ],
  topicSlugs: topicSlugsFor("medicine, public health, biomedical sciences and clinical research"),
} as const;

const rounds: readonly Round[] = [
  {
    sourceRecordId: "academy-professorships-round-16",
    title: "Academy of Medical Sciences Professorships",
    type: "GRANT",
    sourceUrl: academy + "/professorships",
    reviewedOn: "2026-11-26",
    deadline: "2027-01-06T16:00:00Z",
    opens: "2026-10-14T00:00:00Z",
    countryCode: "GB",
    organization: { name: "The Academy of Medical Sciences", type: "FOUNDATION", website: "https://acmedsci.ac.uk" },
    description: "Research funding for biomedical and healthcare researchers taking up a full professorship in the UK after working abroad.",
    topicSlugs: topicSlugsFor("biomedical sciences, healthcare research"),
    metadata: { awardMax: 500000, awardCurrency: "GBP", eligibilitySummary: "Applicants must have recently taken up, accepted or been offered a full professorship at a UK higher education institution and have moved or plan to move to the UK." },
  },
  {
    sourceRecordId: "academy-cross-sector-2027",
    title: "Academy of Medical Sciences Cross-sector Experience Awards",
    type: "GRANT",
    sourceUrl: academy + "/cross-sector-experience-awards",
    reviewedOn: "2026-11-26",
    deadline: "2027-02-12T16:00:00Z",
    opens: "2026-10-29T00:00:00Z",
    countryCode: "GB",
    organization: { name: "The Academy of Medical Sciences", type: "FOUNDATION", website: "https://acmedsci.ac.uk" },
    description: "Supports three to twelve months of work in another sector for people whose work improves human health.",
    topicSlugs: topicSlugsFor("biomedical research, healthcare innovation and public health"),
    metadata: { awardMax: 100000, awardCurrency: "GBP", eligibilitySummary: "Eligible applicants must have a contract extending beyond the grant and be able to dedicate at least half their working time. Undergraduate applicants are ineligible." },
  },
  {
    sourceRecordId: "nihr-prevention-impact-2026-12",
    title: "NIHR Three Schools Prevention Programme Impact Accelerator Awards",
    type: "GRANT",
    sourceUrl: nihr + "/impact-accelerator-awards/",
    reviewedOn: "2026-11-26",
    deadline: "2026-12-18T12:00:00Z",
    countryCode: "GB",
    organization: { name: "National Institute for Health and Care Research", type: "FOUNDATION", website: "https://www.nihr.ac.uk" },
    description: "Supports work that expands the impact of existing prevention research, including dissemination and engagement with research users.",
    topicSlugs: topicSlugsFor("public health, prevention research"),
    metadata: { status: "open", eligibilitySummary: "Applicants need an existing project funded by the NIHR Three Research Schools Prevention research programme." },
  },
  {
    sourceRecordId: "barts-advancing-healthcare-large-2027-02",
    title: "Barts Charity Advancing Healthcare Large Grants",
    type: "GRANT",
    sourceUrl: barts + "/funding/advancing-healthcare-large-grants/",
    evidence: [{ url: barts + "/funding/advancing-healthcare-large-grants/", match: "18 February 2027" }],
    deadline: "2027-02-18T17:00:00Z",
    countryCode: "GB",
    organization: { name: "Barts Charity", type: "FOUNDATION", website: barts },
    description: "Funds healthcare improvement pilots at Barts Health. The published range is over £75,000 and up to £550,000. Scientific and clinical research projects use the charity's separate research schemes.",
    topicSlugs: topicSlugsFor("healthcare delivery, medical technology and public health"),
    metadata: { awardMin: 75000, awardMax: 550000, awardCurrency: "GBP", eligibilitySummary: "Lead applicants must be employed by Barts Health NHS Trust for the duration of the proposed work." },
  },
  {
    ...taiwanScholarship,
    sourceRecordId: "kmu-international-masters-2027",
    title: "KMU International Student Scholarship · Master’s",
    type: "MASTERS_SCHOLARSHIP",
    description: "Kaohsiung Medical University's scholarship for prospective international master's students. Applications for the award accompany the admission application.",
    metadata: { degreeFunding: true, awardMin: 70000, awardMax: 140000, awardCurrency: "TWD", eligibilitySummary: "Prospective international master's students. KMU lists Type B (NT$80,000–140,000) and Type C (NT$70,000–80,000) annual support." },
  },
  {
    ...taiwanScholarship,
    sourceRecordId: "kmu-international-phd-2027",
    title: "KMU International Student Scholarship · PhD",
    type: "PHD_SCHOLARSHIP",
    description: "Kaohsiung Medical University's scholarship for prospective international PhD students. Applications for the award accompany the admission application.",
    metadata: { degreeFunding: true, awardMax: 260000, awardCurrency: "TWD", eligibilitySummary: "Prospective international PhD students. Standard award tiers and department-specific support have different terms." },
  },
];

export const verifiedPublisherRoundsSource: OpportunitySourceConnector = {
  id: "verified-publisher-rounds",
  kind: "grants",
  source: { name: "Verified publisher funding rounds", type: "FUNDER", verified: true },
  homepage: academy,
  description: "Dated funding rounds from sponsor websites. Some calls are checked automatically; others have a recorded editorial review date.",
  completeSnapshot: false,
  intervalMinutes: 360,
  isEnabled: () => true,
  async collect({ fetch, now }) {
    const robots = new Map<string, Promise<string | null>>();
    const checkedPages = new Map<string, Promise<boolean>>();
    const current = rounds.filter(round => Date.parse(round.deadline) >= now.getTime());
    const checked = await mapWithConcurrency(current, 2, async ({ evidence = [], opens, reviewedOn, ...record }) => {
      for (const entry of evidence) {
        const key = JSON.stringify(entry);
        const check = checkedPages.get(key) ?? programmePagePublished(fetch, entry, robots);
        checkedPages.set(key, check);
        if (!await check) return null;
      }
      return {
        ...record,
        applicationUrl: record.applicationUrl ?? record.sourceUrl,
        metadata: {
          ...record.metadata,
          ...(reviewedOn ? { sourceReviewedOn: reviewedOn, sourceVerification: "editorial" } : {}),
          ...(opens ? { openingDate: opens.slice(0, 10), status: now.getTime() < Date.parse(opens) ? "forthcoming" : "open" } : {}),
        },
      };
    });
    return checked.filter((record): record is NonNullable<typeof record> => record !== null);
  },
};
