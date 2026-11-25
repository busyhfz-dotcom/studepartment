import type { OpportunityIngestionRecord } from "../ingestion";
import { methodSlugsFor, topicSlugsFor } from "./classify";
import { mapWithConcurrency } from "./http";
import { programmePagePublished } from "./programme-registry";
import type { OpportunitySourceConnector } from "./types";

type Call = {
  id: string; title: string; type: "PHD_SCHOLARSHIP" | "GRANT"; country: string;
  institution: string; url: string; match: string; deadline: string;
  description: string; subject: string; eligibility: string; awardMax?: number; currency?: string;
};

const calls: readonly Call[] = [
  {
    id:"stanford-biomedical-data-science-2027", type:"PHD_SCHOLARSHIP", country:"US",
    title:"Stanford Biomedical Data Science PhD · 2027 entry", institution:"Stanford University",
    url:"https://dbds.stanford.edu/for-prospective-students/", match:"December 1, 2026",
    deadline:"2026-12-01T23:59:59-08:00",
    description:"PhD in biomedical data science through Stanford Biosciences. Stanford provides tuition, insurance and a stipend to Biosciences PhD students in good standing.",
    subject:"Bioinformatics, machine learning and biomedical data science",
    eligibility:"International applicants can apply. Graduate admissions and English proficiency requirements apply.",
  },
  {
    id:"harvard-biological-biomedical-sciences-2027", type:"PHD_SCHOLARSHIP", country:"US",
    title:"Harvard Biological and Biomedical Sciences PhD · 2027 entry", institution:"Harvard University",
    url:"https://gsas.harvard.edu/program/biological-and-biomedical-sciences", match:"Dec 01, 2026",
    deadline:"2026-12-01T17:00:00-05:00",
    description:"Doctoral training across biomedical research. Consult Harvard Griffin GSAS for the doctoral funding package and admissions conditions.",
    subject:"Molecular biology, immunology and cancer research",
    eligibility:"Check Harvard’s degree and English proficiency requirements for international applicants.",
  },
  {
    id:"cruk-early-detection-primer-2027", type:"GRANT", country:"GB",
    title:"Cancer Research UK Early Detection and Diagnosis Primer Award", institution:"Cancer Research UK",
    url:"https://www.cancerresearchuk.org/for-researchers/apply-for-and-manage-your-funding/our-funding-schemes/early-detection-diagnosis-primer-award", match:"11 Mar 2027",
    deadline:"2027-03-11",
    description:"Funds early projects and pilot studies relevant to the early detection or diagnosis of cancer. The funder lists up to £100,000 for up to 12 months.",
    subject:"Cancer and early detection",
    eligibility:"Check the UK host institution and applicant requirements in the call.",
    awardMax:100000, currency:"GBP",
  },
  {
    id:"astar-italy-singapore-health-2026", type:"GRANT", country:"SG",
    title:"Italy–Singapore research cooperation · Health and Medical", institution:"Agency for Science, Technology and Research (A*STAR)",
    url:"https://www.a-star.edu.sg/research/funding-opportunities/2nd-epstc-ita-sgp", match:"Translational Medicine and Neuroscience",
    deadline:"2026-11-27",
    description:"The health and medical strand of the joint 2027–2029 call covers ageing, translational medicine and neuroscience.",
    subject:"Neuroscience and translational medicine",
    eligibility:"Joint application: at least one eligible Singapore public research institution and one eligible Italian public research institution.",
    awardMax:450000, currency:"SGD",
  },
  {
    id:"astar-iaf-industry-collaboration", type:"GRANT", country:"SG",
    title:"A*STAR Industry Alignment Fund · Industry Collaboration Projects", institution:"Agency for Science, Technology and Research (A*STAR)",
    url:"https://www.a-star.edu.sg/Research/funding-opportunities/iaf-icp", match:"open to all Public Research Institutions in Singapore",
    deadline:"Rolling",
    description:"Cross-disciplinary support for eligible collaborative research with industry. Check the sponsor’s current scope for health and medical research proposals.",
    subject:"Health research and biomedical innovation",
    eligibility:"Application through an eligible Singapore public research institution, with an industry partner.",
  },
];

export const verifiedWorkbookCallsSource: OpportunitySourceConnector = {
  id:"verified-workbook-calls", kind:"scholarships",
  source:{name:"Verified medical graduate and research calls",type:"FUNDER",verified:true},
  homepage:"https://dbds.stanford.edu/for-prospective-students/",
  description:"Dated graduate and research funding calls verified on funder and university pages.",
  completeSnapshot:true, allowEmptySnapshot:true, intervalMinutes:360, staleGraceHours:24,
  isEnabled:()=>true,
  async collect({fetch,now}) {
    const today = now.toISOString().slice(0,10);
    const eligible = calls.filter(call=>call.deadline==="Rolling" || (call.deadline.length===10 ? call.deadline>=today : Date.parse(call.deadline)>now.getTime()));
    const robots = new Map<string, Promise<string | null>>();
    const records = await mapWithConcurrency(eligible, 3, async (call):Promise<OpportunityIngestionRecord|null> => {
      if (!await programmePagePublished(fetch,call,robots)) return null;
      return {
        sourceRecordId:call.id, sourceUrl:call.url, applicationUrl:call.url, title:call.title, type:call.type,
        description:call.description, countryCode:call.country, deadline:call.deadline,
        organization:{name:call.institution,type:call.type==="GRANT"?"FOUNDATION":"UNIVERSITY",countryCode:call.country,website:new URL(call.url).origin},
        topicSlugs:topicSlugsFor(call.subject), methodSlugs:methodSlugsFor(call.subject), status:"ACTIVE",
        metadata:{status:"open",eligibilitySummary:call.eligibility,...(call.awardMax ? {awardMax:call.awardMax,awardCurrency:call.currency}: {})},
      };
    });
    return records.filter((record):record is OpportunityIngestionRecord=>record!==null);
  },
};
