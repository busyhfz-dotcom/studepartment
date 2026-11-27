import type { OpportunityIngestionRecord } from "../ingestion";
import { methodSlugsFor, topicSlugsFor } from "./classify";
import { programmePagePublished } from "./programme-registry";
import type { OpportunitySourceConnector } from "./types";

type WorkbookCall = Omit<OpportunityIngestionRecord, "topicSlugs" | "methodSlugs"> & {
  subject: string;
  review?: { url: string; match: string };
};

const foundation = {
  name: "The Michael J. Fox Foundation",
  type: "FOUNDATION",
  countryCode: "US",
  website: "https://www.michaeljfox.org",
} as const;

const calls: readonly WorkbookCall[] = [
  {
    sourceRecordId: "max-planck-cognition-2027",
    title: "Max Planck School of Cognition · Funded PhD 2027",
    type: "PHD_SCHOLARSHIP",
    organization: { name: "Max Planck School of Cognition", type: "RESEARCH_INSTITUTE", countryCode: "DE" },
    countryCode: "DE",
    sourceUrl: "https://cognition.maxplanckschools.org/en/application",
    deadline: "2026-12-01",
    description: "Fully funded four-year doctoral training in cognition, with an orientation year followed by supervised research.",
    subject: "Cognitive neuroscience, psychology, neurobiology and neuroimaging",
    metadata: { eligibilitySummary: "Candidates may enter with a relevant bachelor’s or master’s degree. Check the published application and English requirements." },
  },
  {
    sourceRecordId: "phid-erasmus-mundus-2027",
    title: "Erasmus Mundus Master in Public Health in Disasters · 2027",
    type: "MASTERS_SCHOLARSHIP",
    organization: { name: "University of Oviedo", type: "UNIVERSITY", countryCode: "ES" },
    countryCode: "ES",
    sourceUrl: "https://masterpublichealthdisasters.eu/",
    deadline: "2026-12-31",
    description: "Joint master’s with the University of Oviedo, Karolinska Institutet and the University of Nicosia. The consortium publishes the scholarship application instructions.",
    subject: "Public health, disasters and global health",
    metadata: { eligibilitySummary: "See the consortium’s degree, language and scholarship criteria. Indicate in the application whether you seek scholarship consideration." },
  },
  {
    sourceRecordId: "neurasmus-erasmus-mundus-2027",
    title: "Neurasmus · Erasmus Mundus Master’s Scholarship in Neuroscience 2027",
    type: "MASTERS_SCHOLARSHIP",
    organization: { name: "University of Bordeaux", type: "UNIVERSITY", countryCode: "FR" },
    countryCode: "FR",
    sourceUrl: "https://www.neurasmus.u-bordeaux.fr/admission/key-dates-admission",
    deadline: "2026-12-15T12:00:00+01:00",
    deadlineTimezone: "Europe/Paris",
    description: "The Neurasmus consortium publishes a dedicated scholarship application round for its 2027–2029 neuroscience master’s cohort.",
    subject: "Neuroscience and computational neuroscience",
    metadata: { eligibilitySummary: "Consult the consortium’s degree and language criteria. A separate deadline applies to self-funded applicants." },
  },
  {
    sourceRecordId: "nih-mrsp-2027",
    title: "NIH Medical Research Scholars Program · 2027–2028",
    type: "FELLOWSHIP",
    organization: { name: "NIH Clinical Center", type: "RESEARCH_INSTITUTE", countryCode: "US" },
    countryCode: "US",
    city: "Bethesda",
    sourceUrl: "https://www.cc.nih.gov/training/mrsp",
    applicationUrl: "https://ocrtmeapps.cc.nih.gov/mrsp/",
    deadline: "2026-12-01T17:00:00-05:00",
    deadlineTimezone: "America/New_York",
    description: "A year of mentored research at the NIH Clinical Center for eligible students enrolled in accredited medical, dental or veterinary programmes in the United States or its territories.",
    subject: "Biomedical, clinical and translational research",
    metadata: { eligibilitySummary: "U.S. citizens or permanent residents in eligible programmes. Current PhD and MD/PhD students are ineligible." },
  },
  {
    sourceRecordId: "mjff-safra-2026",
    title: "Edmond J. Safra Fellowship in Movement Disorders · Institutional Grant",
    type: "GRANT",
    organization: foundation,
    sourceUrl: "https://www.michaeljfox.org/grant/edmond-j-safra-fellowship-movement-disorders",
    deadline: "2026-12-03",
    description: "Funds academic centres to train a new clinician-researcher in movement disorders over two years.",
    subject: "Parkinson’s disease, neurology and movement disorders",
    metadata: { eligibilitySummary: "Academic centres worldwide apply directly. Check restrictions for recent awardees and centres already training a Safra fellow.", awardMax: 180000, awardCurrency: "USD" },
  },
  {
    sourceRecordId: "mjff-therapeutics-pipeline",
    title: "Parkinson’s Disease Therapeutics Pipeline Program",
    type: "GRANT",
    organization: foundation,
    sourceUrl: "https://www.michaeljfox.org/grant/parkinsons-disease-therapeutics-pipeline-program",
    deadline: "Rolling",
    review: { url: "https://www.michaeljfox.org/grant/parkinsons-disease-therapeutics-pipeline-program", match: "pre-proposals accepted on a rolling basis" },
    description: "Supports eligible Parkinson’s therapy-development projects. A pre-proposal begins the review process.",
    subject: "Parkinson’s disease and therapeutic development",
    metadata: { eligibilitySummary: "Check the sponsor’s programme scope and pre-proposal requirements." },
  },
  {
    sourceRecordId: "mjff-biomarker-innovation",
    title: "Parkinson’s Disease Biomarker Innovation and Advancement Program",
    type: "GRANT",
    organization: foundation,
    sourceUrl: "https://www.michaeljfox.org/grant/parkinsons-disease-biomarker-innovation-and-advancement-program",
    deadline: "Rolling",
    review: { url: "https://www.michaeljfox.org/grant/parkinsons-disease-biomarker-innovation-and-advancement-program", match: "pre-proposals are accepted on a rolling basis" },
    description: "Supports the development and evaluation of Parkinson’s disease biomarker tools. Full proposals are by invitation following review of a pre-proposal.",
    subject: "Parkinson’s disease and biomarkers",
    metadata: { eligibilitySummary: "Check the funder’s scope, organisational eligibility and staged submission requirements." },
  },
];

export const submittedSeedCallsSource: OpportunitySourceConnector = {
  id: "submitted-seed-calls",
  kind: "scholarships",
  source: { name: "Verified Provenant seed calls", type: "FUNDER", verified: true },
  homepage: "https://masterpublichealthdisasters.eu/",
  description: "Individual application rounds and rolling calls verified from the Provenant opportunities workbook.",
  completeSnapshot: true,
  allowEmptySnapshot: true,
  intervalMinutes: 720,
  staleGraceHours: 48,
  isEnabled: () => true,
  async collect({ fetch, now }) {
    const today = now.toISOString().slice(0, 10);
    const robots = new Map<string, Promise<string | null>>();
    const records: OpportunityIngestionRecord[] = [];

    for (const { subject, review, ...call } of calls) {
      if (review && !await programmePagePublished(fetch, review, robots)) continue;
      const deadline = call.deadline ?? "";
      if (deadline !== "Rolling" && (deadline.length === 10 ? deadline < today : Date.parse(deadline) <= now.getTime())) continue;

      records.push({
        ...call,
        applicationUrl: call.applicationUrl ?? call.sourceUrl,
        status: "ACTIVE",
        topicSlugs: topicSlugsFor(subject),
        methodSlugs: methodSlugsFor(subject),
        metadata: { status: "open", ...call.metadata },
      });
    }
    return records;
  },
};
