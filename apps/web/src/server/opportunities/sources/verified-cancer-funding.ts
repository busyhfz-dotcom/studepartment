import type { OpportunityIngestionRecord } from "../ingestion";
import { topicSlugsFor } from "./classify";
import { mapWithConcurrency } from "./http";
import { programmePagePublished } from "./programme-registry";
import type { OpportunitySourceConnector } from "./types";

// Each record points to a specific provider page. The date is the first
// required application step, including an outline or letter of intent.
type Call = {
  id: string;
  title: string;
  funder: string;
  type: "GRANT" | "FELLOWSHIP" | "PHD_SCHOLARSHIP" | "MASTERS_SCHOLARSHIP";
  country: string | null;
  region: string;
  url: string;
  match: string;
  deadline: string | null;
  timezone: string | null;
  summary: string;
  applicationUrl?: string;
  reviewUntil?: string;
  award?: { max: number; currency: string };
};

const calls: readonly Call[] = [
  {
    id: "embo-postdoctoral", type: "FELLOWSHIP", country: null, region: "International",
    title: "EMBO Postdoctoral Fellowships", funder: "EMBO",
    url: "https://www.embo.org/funding/fellowships-grants-and-career-support/postdoctoral-fellowships/",
    match: "22 January 2027", deadline: "2027-01-22T14:00:00+01:00", timezone: "Europe/Berlin",
    summary: "Applications are accepted throughout the year. This date is the cutoff for the next selection round. The fellowship supports international mobility after a doctorate in the life sciences.",
  },
  {
    id: "embo-exchange", type: "GRANT", country: null, region: "International",
    title: "EMBO Scientific Exchange Grants", funder: "EMBO",
    url: "https://www.embo.org/funding/fellowships-grants-and-career-support/scientific-exchange-grants/",
    match: "Applications accepted throughout the year", deadline: "Rolling", timezone: null,
    summary: "Funding for short research visits to laboratories in another eligible country. Check EMBO’s country and timing requirements before applying.",
  },
  {
    id: "swiss-cancer-research-grants", type: "GRANT", country: "CH", region: "Switzerland",
    title: "Swiss Cancer Research Foundation and Swiss Cancer League Research Grants", funder: "Swiss Cancer Research Foundation and Swiss Cancer League",
    url: "https://www.cancerresearch.ch/for-researchers/funding-opportunities/research-grants/",
    match: "31 January and 31 July", deadline: "2027-01-31T12:00:00+01:00", timezone: "Europe/Zurich",
    summary: "Project funding for cancer research based at Swiss institutions, including clinical, epidemiological and psychosocial research.",
  },
  {
    id: "swiss-cancer-international-fellows", type: "FELLOWSHIP", country: "CH", region: "Switzerland",
    title: "Swiss Cancer Research International Research Fellowships", funder: "Swiss Cancer Research Foundation",
    url: "https://www.cancerresearch.ch/for-researchers/funding-opportunities/translate-to-english-fellowships/translate-to-english-international-research-fellowships",
    match: "31 January and 31 July", deadline: "2027-01-31T12:00:00+01:00", timezone: "Europe/Zurich",
    summary: "Research visits abroad for early-career clinicians with a medical degree, experience in cancer research or treatment, and the Swiss connection required by the funder.",
  },
  {
    id: "quancer-prevention-2027", type: "GRANT", country: "CH", region: "Switzerland",
    title: "Fondation Quancer Cancer Prevention Research Grant", funder: "Fondation Quancer",
    url: "https://quancer.ch/open-call-2027/",
    match: "10/01/2027", deadline: "2027-01-10", timezone: "Europe/Zurich",
    summary: "The 2027 call funds projects focused on cancer prevention. Check the foundation’s host and eligibility rules.",
  },
  {
    id: "snsf-postdoc-mobility", type: "FELLOWSHIP", country: "CH", region: "Switzerland",
    title: "SNSF Postdoc.Mobility Fellowship", funder: "Swiss National Science Foundation",
    url: "https://www.snf.ch/en/ZX8LHi9P5dl1JPOw/news/call-for-postdocmobility",
    match: "02.02.2027", deadline: "2027-02-02T17:00:00+01:00", timezone: "Europe/Zurich",
    summary: "Support for a research stay abroad after a doctorate for applicants who meet the programme’s Swiss-link requirement.",
  },
  {
    id: "wilhelm-sander-medical-research", type: "GRANT", country: null, region: "Germany and Switzerland",
    title: "Wilhelm Sander Foundation Medical Research Grant", funder: "Wilhelm Sander Foundation",
    url: "https://www.wilhelm-sander-stiftung.de/antragstellung/",
    match: "Förderanträge können jederzeit eingereicht werden", deadline: "Rolling", timezone: null,
    summary: "Rolling funding for medical research, with priority for cancer research, at eligible institutions in Germany or Switzerland.",
  },
  {
    id: "cancerfonden-next-steps-2026", type: "GRANT", country: "SE", region: "Sweden",
    title: "Swedish Cancer Society Next Steps Grant", funder: "Swedish Cancer Society",
    url: "https://www.cancerfonden.se/forskning/for-forskare/sok-anslag-for-forskare/guidelines-next-steps",
    match: "15 December", deadline: "2026-12-15", timezone: "Europe/Stockholm",
    summary: "Translation or implementation funding for previously funded cancer research. An eligible Swedish research institution and an established Innovation Office collaboration are required.",
  },
  {
    id: "mildred-scheel-postdoc", type: "FELLOWSHIP", country: "DE", region: "Germany",
    title: "Mildred Scheel Postdoctoral Programme", funder: "German Cancer Aid",
    url: "https://www.krebshilfe.de/forschen/foerderung/foerderprogramme/nachwuchsfoerderung/mildred-scheel-postdoktoranden/",
    match: "Januar 2027", deadline: "2027-01-26T13:00:00+01:00", timezone: "Europe/Berlin",
    summary: "Postdoctoral funding for cancer research in Germany or for a research stay abroad, subject to German Cancer Aid’s eligibility rules.",
  },
  {
    id: "dfg-emmy-noether", type: "GRANT", country: "DE", region: "Germany",
    title: "DFG Emmy Noether Programme", funder: "German Research Foundation (DFG)",
    url: "https://www.dfg.de/en/research-funding/funding-opportunities/programmes/individual/emmy-noether",
    match: "at any time", deadline: "Rolling", timezone: null,
    summary: "Supports eligible early-career researchers to lead an independent group at a German research institution. Biomedical projects are eligible under the discipline-neutral programme.",
  },
  {
    id: "dfg-walter-benjamin", type: "FELLOWSHIP", country: null, region: "Germany and eligible research hosts abroad",
    title: "DFG Walter Benjamin Programme", funder: "German Research Foundation (DFG)",
    url: "https://www.dfg.de/en/research-funding/funding-opportunities/programmes/individual/walter-benjamin",
    match: "at any time", deadline: "Rolling", timezone: null,
    summary: "Early postdoctoral support for a self-directed research project. The programme can fund a position in Germany or a fellowship abroad.",
  },
  {
    id: "fwf-principal-investigator", type: "GRANT", country: "AT", region: "Austria",
    title: "FWF Principal Investigator Projects", funder: "Austrian Science Fund",
    url: "https://www.fwf.ac.at/en/funding/portfolio/projects/principal-investigator-projects",
    match: "Rolling submissions", deadline: "Rolling", timezone: null,
    summary: "Project support for basic research across disciplines, including biomedical research, through an eligible Austrian research institution.",
  },
  {
    id: "ista-life-sciences-phd-2027", type: "PHD_SCHOLARSHIP", country: "AT", region: "Austria",
    title: "ISTA Funded PhD Programme in the Life Sciences", funder: "Institute of Science and Technology Austria",
    url: "https://phd.pages.ista.ac.at/phd-application-admission/",
    match: "January 8, 2027", deadline: "2027-01-08T15:00:00+01:00", timezone: "Europe/Vienna",
    summary: "Funded PhD entry with an interdisciplinary life sciences track. The central application admits candidates into the programme before they choose a thesis group.",
  },
  {
    id: "cruk-early-detection-outline-2027", type: "GRANT", country: "GB", region: "United Kingdom",
    title: "Cancer Research UK Early Detection and Diagnosis Programme Award", funder: "Cancer Research UK",
    url: "https://www.cancerresearchuk.org/for-researchers/apply-for-and-manage-your-funding/our-funding-schemes/early-detection-diagnosis-programme-award",
    match: "11 Mar 2027", deadline: "2027-03-11", timezone: "Europe/London",
    summary: "Funding for cancer early-detection and diagnosis programmes at eligible UK institutions. The deadline shown is for the initial outline in the open round.",
  },
  {
    id: "oxford-clarendon-masters", type: "MASTERS_SCHOLARSHIP", country: "GB", region: "United Kingdom",
    title: "Oxford Clarendon Scholarship for Master’s Study", funder: "University of Oxford",
    url: "https://www.chch.ox.ac.uk/college/graduate/fees-scholarships-and-funding",
    match: "will automatically be considered for Clarendon awards", deadline: null, timezone: null,
    applicationUrl: "https://www.ox.ac.uk/admissions/graduate/fees-and-funding/funding/clarendon/applicants", reviewUntil: "2027-01-31",
    summary: "Oxford considers eligible master’s applicants for Clarendon funding automatically if they meet their course’s December or January funding deadline. Clinical and medical sciences programmes are included subject to course eligibility.",
  },
  {
    id: "oxford-clarendon-dphil", type: "PHD_SCHOLARSHIP", country: "GB", region: "United Kingdom",
    title: "Oxford Clarendon Scholarship for DPhil Study", funder: "University of Oxford",
    url: "https://www.chch.ox.ac.uk/college/graduate/fees-scholarships-and-funding",
    match: "will automatically be considered for Clarendon awards", deadline: null, timezone: null,
    applicationUrl: "https://www.ox.ac.uk/admissions/graduate/fees-and-funding/funding/clarendon/applicants", reviewUntil: "2027-01-31",
    summary: "Oxford considers eligible DPhil applicants for Clarendon funding automatically if they meet their course’s December or January funding deadline. Check the chosen course for the exact date.",
  },
  {
    id: "cri-irvington-postdoctoral", type: "FELLOWSHIP", country: null, region: "International",
    title: "CRI Irvington Postdoctoral Fellowship", funder: "Cancer Research Institute",
    url: "https://www.cancerresearch.org/cri-irvington-postdoctoral-fellowship",
    match: "March 1, 2027", deadline: "2027-03-01", timezone: "America/New_York",
    award: {"max":243000,"currency":"USD"},
    summary: "Mentored postdoctoral funding in immunology or cancer immunology. Applicants need a doctoral degree by award activation and an eligible research sponsor.",
  },
  {
    id: "cri-ignite", type: "GRANT", country: null, region: "International",
    title: "CRI IGNITE Award", funder: "Cancer Research Institute",
    url: "https://www.cancerresearch.org/ignite",
    match: "February 1, 2027", deadline: "2027-02-01T23:59:00-05:00", timezone: "America/New_York",
    award: {"max":1050000,"currency":"USD"},
    summary: "Two stages of research funding for the transition from a mentored postdoc to an independent tenure-track position. The hiring institution must provide a formal commitment.",
  },
  {
    id: "damon-runyon-quantitative", type: "FELLOWSHIP", country: "US", region: "United States",
    title: "Damon Runyon Quantitative Biology Fellowship", funder: "Damon Runyon Cancer Research Foundation",
    url: "https://www.damonrunyon.org/for-scientists/application-guidelines/quantitative",
    match: "December 1, 2026", deadline: "2026-12-01T16:00:00-05:00", timezone: "America/New_York",
    summary: "Postdoctoral training at the intersection of quantitative sciences and cancer research.",
  },
  {
    id: "damon-runyon-physician-scientist", type: "FELLOWSHIP", country: "US", region: "United States",
    title: "Damon Runyon Physician-Scientist Training Award", funder: "Damon Runyon Cancer Research Foundation",
    url: "https://www.damonrunyon.org/for-scientists/application-guidelines/physician-scientist",
    match: "December 1, 2026", deadline: "2026-12-01T16:00:00-05:00", timezone: "America/New_York",
    award: {"max":460000,"currency":"USD"},
    summary: "Four years of mentored cancer research support for eligible physicians who have completed their residency and clinical training.",
  },
  {
    id: "damon-runyon-clinical-investigator", type: "GRANT", country: "US", region: "United States",
    title: "Damon Runyon Clinical Investigator Award", funder: "Damon Runyon Cancer Research Foundation",
    url: "https://www.damonrunyon.org/for-scientists/application-guidelines/clinical-investigator/forms",
    match: "January 19, 2027", deadline: "2027-01-19T16:00:00-05:00", timezone: "America/New_York",
    summary: "Support for early-career physician-scientists pursuing clinical cancer research. Check the foundation’s faculty appointment and institutional requirements.",
  },
  {
    id: "aacr-leonard-basic-cancer", type: "FELLOWSHIP", country: null, region: "International",
    title: "AACR John and Elizabeth Leonard Basic Cancer Research Fellowship", funder: "American Association for Cancer Research",
    url: "https://www.aacr.org/grants/aacr-john-and-elizabeth-leonard-basic-cancer-research-fellowship/",
    match: "November 24, 2026", deadline: "2026-11-24T13:00:00-05:00", timezone: "America/New_York",
    award: {"max":130000,"currency":"USD"},
    summary: "Two years of mentored basic cancer research support for a postdoctoral or clinical research fellow. The first deadline is for a letter of intent.",
  },
  {
    id: "aacr-bcrf-career-development", type: "GRANT", country: null, region: "International",
    title: "Breast Cancer Research Foundation–AACR Career Development Awards", funder: "American Association for Cancer Research and Breast Cancer Research Foundation",
    url: "https://www.aacr.org/grants/breast-cancer-research-foundation-aacr-career-development-awards/",
    match: "December 15, 2026", deadline: "2026-12-15T13:00:00-05:00", timezone: "America/New_York",
    award: {"max":375000,"currency":"USD"},
    summary: "Career development funding for early-career breast cancer investigators. The first deadline is for a letter of intent.",
  },
  {
    id: "cri-star", type: "GRANT", country: null, region: "International",
    title: "CRI Lloyd J. Old STAR Program", funder: "Cancer Research Institute",
    url: "https://www.cancerresearch.org/lloyd-j-old-star-program",
    match: "January 15, 2027", deadline: "2027-01-15T23:59:00-05:00", timezone: "America/New_York",
    award: {"max":1250000,"currency":"USD"},
    summary: "Flexible support for mid-career scientists independently pursuing cancer immunotherapy research.",
  },
  {
    id: "cri-clip", type: "GRANT", country: null, region: "International",
    title: "CRI Clinic and Laboratory Integration Program", funder: "Cancer Research Institute",
    url: "https://www.cancerresearch.org/clip",
    match: "December 1, 2026", deadline: "2026-12-01T23:59:00-05:00", timezone: "America/New_York",
    award: {"max":1000000,"currency":"USD"},
    summary: "Cancer immunology project funding for translational research teams. The first deadline is for a letter of intent.",
  },
  {
    id: "aacr-kbc-monosomy7", type: "GRANT", country: null, region: "International",
    title: "AACR–Kids Beating Cancer Margaret Guedes Monosomy 7 Legacy Cancer Research Grant", funder: "American Association for Cancer Research and Kids Beating Cancer",
    url: "https://www.aacr.org/grants/aacr-kids-beating-cancer-margaret-guedes-monosomy-7-legacy-cancer-research-grant/",
    match: "December 1, 2026", deadline: "2026-12-01T13:00:00-05:00", timezone: "America/New_York",
    award: {"max":300000,"currency":"USD"},
    summary: "Research support for teams studying monosomy 7 and its role in cancer and related disorders. Consult the eligibility criteria and scope of the current call.",
  },
  {
    id: "aacr-male-breast-cancer", type: "GRANT", country: null, region: "International",
    title: "AACR–Male Breast Cancer Global Alliance Innovation and Discovery Grant", funder: "American Association for Cancer Research and Male Breast Cancer Global Alliance",
    url: "https://www.aacr.org/grants/aacr-male-breast-global-alliance-innovation-and-discovery-grant-for-male-breast-cancer-research/",
    match: "January 12, 2027", deadline: "2027-01-12T13:00:00-05:00", timezone: "America/New_York",
    award: {"max":50000,"currency":"USD"},
    summary: "Funding for research addressing male breast cancer. The official notice gives eligibility and application requirements.",
  },
  {
    id: "max-eder-junior-research-groups", type: "GRANT", country: "DE", region: "Germany",
    title: "Max Eder Junior Research Groups", funder: "German Cancer Aid",
    url: "https://www.krebshilfe.de/forschen/foerderung/foerderprogramme/nachwuchsfoerderung/max-eder-nachwuchsgruppen/",
    match: "Januar 2027", deadline: "2027-01-26T13:00:00+01:00", timezone: "Europe/Berlin",
    summary: "Funding to establish an independent cancer research group at an eligible German host institution.",
  },
  {
    id: "dfg-individual-research", type: "GRANT", country: "DE", region: "Germany",
    title: "DFG Individual Research Grants", funder: "German Research Foundation (DFG)",
    url: "https://www.dfg.de/en/research-funding/funding-opportunities/programmes/individual/research-grants",
    match: "The first proposal may be submitted at any time", deadline: "Rolling", timezone: null,
    summary: "Funding for a defined research project, including eligible medical and biomedical research, based at a qualifying institution.",
  },
  {
    id: "dfg-heisenberg", type: "GRANT", country: "DE", region: "Germany",
    title: "DFG Heisenberg Programme", funder: "German Research Foundation (DFG)",
    url: "https://www.dfg.de/en/research-funding/funding-opportunities/programmes/individual/heisenberg",
    match: "Proposals may be submitted at any time", deadline: "Rolling", timezone: null,
    summary: "Funding for researchers qualified for professorship, including options for clinicians and a research project grant for work in Germany.",
  },
  {
    id: "fwf-esprit", type: "FELLOWSHIP", country: "AT", region: "Austria",
    title: "FWF ESPRIT Postdoctoral Programme", funder: "Austrian Science Fund",
    url: "https://www.fwf.ac.at/en/funding/portfolio/careers/esprit",
    match: "Rolling submissions", deadline: "Rolling", timezone: null,
    summary: "Supports the salary and project of an early-career researcher with a mentor at an Austrian host institution. Biomedical projects are eligible.",
  },
  {
    id: "bif-travel", type: "GRANT", country: null, region: "International",
    title: "Boehringer Ingelheim Fonds Travel Grants", funder: "Boehringer Ingelheim Fonds",
    url: "https://bifonds.de/de/stipendien-grants/reisebeihilfen/frequently-asked-questions-travel-grants.html",
    match: "may be submitted at any time", deadline: "Rolling", timezone: null,
    summary: "Travel funding for eligible biomedical research stays, courses or doctoral applicant visits. Apply at least six weeks before departure under the funder’s timing rules.",
  },
  {
    id: "company-of-biologists-travel", type: "GRANT", country: null, region: "International",
    title: "The Company of Biologists Travelling Fellowships", funder: "The Company of Biologists",
    url: "https://www.biologists.com/grants/travelling-fellowships/",
    match: "5 February 2027", deadline: "2027-02-05", timezone: "Europe/London",
    summary: "Research visit funding for eligible graduate students and early-career researchers in the fields covered by the participating journals.",
  },
];

function toRecord(call: Call): OpportunityIngestionRecord {
  const { id, title, funder, type, country, region, url, deadline, timezone, summary, award } = call;
  const degree = type === "PHD_SCHOLARSHIP" || type === "MASTERS_SCHOLARSHIP";
  const career: OpportunityIngestionRecord["eligibleCareerStages"] =
    degree ? ["student"] : type === "FELLOWSHIP" ? ["postdoc"] : [];
  return {
    sourceRecordId: id,
    sourceUrl: url,
    applicationUrl: call.applicationUrl ?? url,
    title,
    type,
    description: summary,
    organization: { name: funder, type: degree ? "UNIVERSITY" : "FOUNDATION", countryCode: country, website: new URL(url).origin },
    countryCode: country,
    deadline,
    deadlineTimezone: timezone,
    eligibleCareerStages: career,
    topicSlugs: topicSlugsFor(title + " " + summary),
    status: "ACTIVE",
    metadata: {
      status: deadline ? "open" : "check-source",
      fundingRegion: region,
      ...(degree ? { degreeFunding: true } : {}),
      ...(award ? { awardMax: award.max, awardCurrency: award.currency } : {}),
    },
  };
}

export const verifiedCancerFundingSource: OpportunitySourceConnector = {
  id: "verified-cancer-research-funding",
  source: { type: "FUNDER", name: "Verified cancer research and training funding", verified: true },
  kind: "grants",
  homepage: "https://www.aacr.org/professionals/research-funding/current-funding-opportunities/",
  description: "Open or rolling grants, fellowships and graduate funding verified on each provider's own application page.",
  completeSnapshot: true,
  allowEmptySnapshot: true,
  intervalMinutes: 720,
  staleGraceHours: 72,
  isEnabled: () => true,
  async collect({ fetch, now, log }) {
    const eligible = calls.filter(({ deadline, timezone, reviewUntil }) => {
      const today = new Intl.DateTimeFormat("en-CA", { timeZone: timezone ?? "UTC" }).format(now);
      if (reviewUntil && reviewUntil < today) return false;
      if (!deadline || deadline === "Rolling") return true;
      return deadline.length === 10 ? deadline >= today : Date.parse(deadline) > now.getTime();
    });
    const robots = new Map<string, Promise<string | null>>();
    const pages = new Map<string, Promise<boolean>>();
    const checked = await mapWithConcurrency(eligible, 4, async (call) => {
      const key = call.url + "#" + call.match;
      let published = pages.get(key);
      if (!published) {
        published = programmePagePublished(fetch, call, robots);
        pages.set(key, published);
      }
      return await published ? toRecord(call) : null;
    });
    const confirmed = checked.filter((record): record is OpportunityIngestionRecord => record !== null);
    if (eligible.length && confirmed.length < eligible.length / 3) {
      throw new Error("Too few official cancer and training pages could be verified");
    }
    log(`Verified cancer and training funding: ${confirmed.length} of ${eligible.length} application pages confirmed`);
    return confirmed;
  },
};
