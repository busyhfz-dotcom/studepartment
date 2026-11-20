import { mapWithConcurrency } from "./http";
import { type Programme, type ProgrammeLevel } from "./programme-registry-data";
import { programmePagePublished, toProgrammeRecords } from "./programme-registry";
import type { OpportunitySourceConnector } from "./types";

const masters = ["MASTERS_SCHOLARSHIP"] as const;
const doctorate = ["PHD_SCHOLARSHIP"] as const;
const medicine = ["MD_SCHOLARSHIP"] as const;
const both = ["MASTERS_SCHOLARSHIP", "PHD_SCHOLARSHIP"] as const;

function universityAward(
  id: string, title: string, provider: string, country: string,
  url: string, match: string, levels: readonly ProgrammeLevel[], summary: string, deadline?: string,
): Programme {
  return { id, title, provider, providerType: "UNIVERSITY", country, url, match, levels: [...levels], summary, deadline };
}

export const UNIVERSITY_AWARDS: Programme[] = [
  universityAward("ucl-impact-mph", "UCL IMPACT Scholarship", "University College London", "GB",
    "https://www.ucl.ac.uk/population-health-sciences/epidemiology-health-care/study/scholarships-and-funding/impact-scholarship",
    "30th June 2027", masters, "An award for the Master of Public Health for applicants with financial need, lived experience of inequality and potential to improve population health.", "2027-06-30T23:59:00+01:00"),
  universityAward("imperial-public-health-masters", "Imperial School of Public Health Master’s Scholarships", "Imperial College London", "GB",
    "https://www.imperial.ac.uk/school-public-health/study/postgraduate/funding-and-scholarships/",
    "Friday 30 April 2027", masters, "Scholarships for the MPH, Epidemiology MSc and Health Data Analytics and Machine Learning MSc. Funding amounts differ by fee status and delivery format.", "2027-04-30T23:59:00+01:00"),
  universityAward("imperial-surgery-cancer-bursaries", "Imperial Department of Surgery and Cancer Bursaries", "Imperial College London", "GB",
    "https://www.imperial.ac.uk/medicine/study/postgraduate/fees-and-funding/masters/",
    "6 January 2027", masters, "Bursaries for selected taught master’s programmes in Imperial’s Department of Surgery and Cancer, open to home and overseas applicants.", "2027-01-06"),
  universityAward("cuhk-mph-admission-2027", "CUHK Master of Public Health Admission Scholarship", "The Chinese University of Hong Kong", "HK",
    "https://www.mph.cuhk.edu.hk/scholarship-financial-aid",
    "Admission Scholarship 2027-28", masters, "An admission scholarship for newly admitted full-time Master of Public Health students for the 2027–28 intake."),
  universityAward("nus-wu-yu-lin-mph", "Wu Yu Lin Master of Public Health Scholarship", "National University of Singapore", "SG",
    "https://sph.nus.edu.sg/education/mph/scholarship-financial-aid/",
    "Wu Yu Lin Master of Public Health Scholarship", masters, "A named award for candidates entering the Master of Public Health at the Saw Swee Hock School of Public Health."),
  universityAward("nus-sph-mph-fellowship", "SSHSPH Master of Public Health Fellowship", "National University of Singapore", "SG",
    "https://sph.nus.edu.sg/education/mph/scholarship-financial-aid/",
    "Master of Public Health Fellowship", masters, "Funding for eligible students enrolled in the NUS Master of Public Health."),
  universityAward("toronto-qeii-gsst-2027", "Queen Elizabeth II Graduate Scholarships in Science and Technology at U of T", "University of Toronto", "CA",
    "https://www.dlsph.utoronto.ca/students/current-students/student-awards-funding-opportunities/current-award-competitions/2027-2028-queen-elizabeth-ii-graduate-scholarships-in-science-and-technology-qeii-gsst/",
    "2027-2028 Queen Elizabeth II", both, "Merit-based funding for research master’s or doctoral students in participating Toronto graduate units including public health, dentistry and pharmaceutical sciences.", "2027-04-19"),
  universityAward("jhu-medicine-doctoral-support", "Johns Hopkins School of Medicine PhD funding", "Johns Hopkins University School of Medicine", "US",
    "https://www.hopkinsmedicine.org/som/education-programs/graduate-programs/admissions/financial",
    "receive financial aid in the form of a tuition scholarship", doctorate, "Admitted School of Medicine PhD students receive tuition funding, health insurance and a stipend. See the university for programme-specific application dates."),
  universityAward("nyu-grossman-md-tuition", "NYU Grossman MD Full-Tuition Scholarship", "NYU Grossman School of Medicine", "US",
    "https://med.nyu.edu/education/md-degree/affordability-financial-aid/types-financial-aid",
    "automatically receives a scholarship", medicine, "Full tuition is covered for students admitted to the MD degree. Additional need-based aid has separate terms."),
  universityAward("nyu-grossman-li-md-tuition", "NYU Grossman Long Island MD Full-Tuition Scholarship", "NYU Grossman Long Island School of Medicine", "US",
    "https://medli.nyu.edu/education/md-degree/financial-aid",
    "three-year accelerated MD program", medicine, "Full tuition for matriculated students in the three-year MD who maintain academic and professional standards."),
  universityAward("einstein-gottesman-md-tuition", "Gottesman Scholarship for MD students", "Albert Einstein College of Medicine", "US",
    "https://einsteinmed.edu/education/student-finance/gottesman-scholarship-fund-md-students",
    "automatically awarded the Gottesman Scholarship", medicine, "Accepted MD students automatically receive support covering tuition and designated educational and technology fees."),
  universityAward("jhu-md-bloomberg-financial-aid", "Johns Hopkins Bloomberg MD Scholarship Support", "Johns Hopkins University School of Medicine", "US",
    "https://www.hopkinsmedicine.org/som/education-programs/md-program/application-process/tuition-and-financial-aid",
    "Bloomberg Philanthropies", medicine, "Need-based MD funding can cover full tuition or full cost of attendance depending on family income, assets and the published eligibility rules."),
  universityAward("cleveland-clinic-lerner-md-tuition", "Cleveland Clinic Lerner College of Medicine Full-Tuition Scholarship", "Cleveland Clinic Lerner College of Medicine", "US",
    "https://my.clevelandclinic.org/lerner-college-medicine/tuition-financial-aid",
    "full tuition scholarship to all CCLCM students", medicine, "Full tuition for students in the five-year research-intensive MD programme, including its required research year."),
universityAward("hms-md-need-based-scholarships", "Harvard Medical School MD Scholarships", "Harvard Medical School", "US",
    "https://meded.hms.harvard.edu/Financial-aid",
    "Middle Income Initiative", medicine, "Need-based Harvard Medical School scholarships for MD students, including support under the Middle Income Initiative. Eligibility depends on the school’s aid assessment."),
  universityAward("duke-mbs-need-based-scholarships", "Duke Master of Biomedical Sciences Scholarships", "Duke University School of Medicine", "US",
    "https://medschool.duke.edu/education/health-professions-education-programs/master-biomedical-sciences/mbs-faqs",
    "need-based scholarship support", masters, "Duke offers need-based scholarship support to selected Master of Biomedical Sciences students."),

];

export const universityDegreeFundingSource: OpportunitySourceConnector = {
  id: "university-degree-funding",
  source: { type: "FUNDER", name: "University degree funding", verified: true },
  kind: "scholarships",
  homepage: "https://www.topuniversities.com/world-university-rankings",
  description: "Named master’s and doctoral awards and medical degree funding verified directly on university pages.",
  completeSnapshot: true,
  intervalMinutes: 720,
  staleGraceHours: 96,
  isEnabled: () => true,
  async collect({ fetch, now, log }) {
    const eligible = UNIVERSITY_AWARDS.filter(({ deadline }) => (
      !deadline || Date.parse(deadline) + (deadline.length === 10 ? 86_400_000 : 0) >= now.getTime()
    ));
    const robots = new Map<string, Promise<string | null>>();
    const confirmed = await mapWithConcurrency(eligible, 4, (award) => programmePagePublished(fetch, award, robots));
    if (confirmed.filter(Boolean).length < eligible.length / 3) throw new Error("Too few university award pages could be verified");
    log(`University degree funding: ${confirmed.filter(Boolean).length} of ${eligible.length} awards confirmed`);
    return eligible.flatMap((award, index) => confirmed[index] ? toProgrammeRecords(award) : []);
  },
};
