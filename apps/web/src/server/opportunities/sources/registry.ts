import { brainCanadaTrainingSource } from "./brain-canada-training";
import { canberraScholarshipSource } from "./canberra-scholarship";
import { canadianCancerFundingSource } from "./canadian-cancer-funding";
import { canadianFundingCalendarSource } from "./canadian-funding-calendar";
import { cnrsResearchCareersSource } from "./cnrs-research-careers";
import { commonwealthMedicalMastersSource } from "./commonwealth-health-scholarships";
import { continentalCareerSources } from "./continental-careers";
import { daadScholarshipsSource, daadDoctoralSource } from "./scholarships";
import { dukeResearchCareersSource } from "./duke-research-careers";
import { eitHealthValidationSource } from "./eit-health-validation";
import { euFundingTendersSource } from "./eu-funding-tenders";
import { extendedResearchSources } from "./extended-research-careers";
import { euraxessSource } from "./euraxess";
import { fapespFellowshipsSource } from "./fapesp-fellowships";
import { grantsGovSource } from "./grants-gov";
import { greenhouseSources } from "./greenhouse";
import { hkuResearchCareersSource } from "./hong-kong-research-careers";
import { hospitalResearchSources } from "./hospital-research-careers";
import { ibsGenomicIntegritySource } from "./ibs-genomic-integrity";
import { ianPotterMedicalResearchSource } from "./ian-potter-medical-research";
import { institutionFeedSources } from "./institution-feeds";
import { lifeArcSource } from "./lifearc";
import { maxPlanckSource } from "./max-planck";
import { mayoClinicResearchSource } from "./mayo-clinic-research";
import { nhsJobsSource } from "./nhs-jobs";
import { nhsScotlandResearchSource } from "./nhs-scotland-research";
import { nihrChildHealthSource } from "./nihr-child-health-funding";
import { nkiResearchCareersSource } from "./nki-research-careers";
import { northernUniversityCareerSources } from "./northern-university-careers";
import { neurologicalFoundationSource } from "./nz-neurological-foundation";
import { oriseResearchFellowshipsSource } from "./orise-research-fellowships";
import { pacificResearchCareerSources } from "./pacific-research-careers";
import { manchesterFundedDoctoratesSource } from "./manchester-funded-doctorates";
import { queenslandFundedProjectsSource } from "./queensland-funded-projects";
import { universityDegreeFundingSource } from "./university-degree-funding";
import { programmeRegistrySource } from "./programme-registry";
import { ritsumeikanScholarshipSource } from "./ritsumeikan-scholarship";
import { rmitMedicalScienceSource } from "./rmit-medical-science";
import { sydneyRtpSource } from "./sydney-rtp";
import { singHealthResearchSource } from "./singhealth-research-careers";
import { smartRecruitersSources } from "./smartrecruiters";
import { swissTphSource } from "./swiss-tph";
import { submittedSeedCallsSource, submittedSeedRollingGrantsSource } from "./submitted-seed-calls";
import type { OpportunitySourceConnector } from "./types";
import { ucasScholarshipsSource } from "./ucas-scholarships";
import { ukriBioscienceSource, ukriMedicalResearchSource, ukriRelatedMedicalSources } from "./ukri-medical-research";
import { californiaResearchCareerSources } from "./university-california-research";
import { usaJobsSource } from "./usajobs";
import { verifiedCancerFundingSource } from "./verified-cancer-funding";
import { verifiedWorkbookCallsSource } from "./verified-workbook-calls";
import { verifiedPublisherRoundsSource } from "./verified-publisher-rounds";
import { wellcomeSource } from "./wellcome";
import { workdayResearchSources } from "./workday-research-careers";
import { westlakeResearchCareersSource } from "./westlake-research-careers";

/** Every publisher Provenant reads automatically, in display order. */
export const opportunitySources: OpportunitySourceConnector[] = [
  daadScholarshipsSource, daadDoctoralSource,
  submittedSeedCallsSource,
  submittedSeedRollingGrantsSource,
  verifiedCancerFundingSource,
  verifiedWorkbookCallsSource,
  verifiedPublisherRoundsSource,
  programmeRegistrySource,
  nkiResearchCareersSource,
  commonwealthMedicalMastersSource,
  universityDegreeFundingSource,
  queenslandFundedProjectsSource,
  manchesterFundedDoctoratesSource,
  ucasScholarshipsSource,
  canberraScholarshipSource,
  ritsumeikanScholarshipSource,
  sydneyRtpSource,
  rmitMedicalScienceSource,
  fapespFellowshipsSource,
  grantsGovSource,
  euFundingTendersSource,
  wellcomeSource,
  nihrChildHealthSource,
  lifeArcSource,
  ianPotterMedicalResearchSource,
  eitHealthValidationSource,
  ukriMedicalResearchSource,
  ukriBioscienceSource,
  ...ukriRelatedMedicalSources,
  neurologicalFoundationSource,
  canadianCancerFundingSource,
  canadianFundingCalendarSource,
  brainCanadaTrainingSource,
  euraxessSource,
  swissTphSource,
  ...continentalCareerSources,
  ...northernUniversityCareerSources,
  ...extendedResearchSources,
  cnrsResearchCareersSource,
  ...pacificResearchCareerSources,
  ibsGenomicIntegritySource,
  hkuResearchCareersSource,
  westlakeResearchCareersSource,
  ...smartRecruitersSources,
  ...workdayResearchSources,
  dukeResearchCareersSource,
  oriseResearchFellowshipsSource,
  mayoClinicResearchSource,
  ...hospitalResearchSources,
  singHealthResearchSource,
  maxPlanckSource,
  nhsJobsSource,
  nhsScotlandResearchSource,
  ...institutionFeedSources,
  usaJobsSource,
  ...californiaResearchCareerSources,
  ...greenhouseSources,
];
