import { brainCanadaTrainingSource } from "./brain-canada-training";
import { canberraScholarshipSource } from "./canberra-scholarship";
import { canadianCancerFundingSource } from "./canadian-cancer-funding";
import { cnrsResearchCareersSource } from "./cnrs-research-careers";
import { continentalCareerSources } from "./continental-careers";
import { daadScholarshipsSource, daadDoctoralSource } from "./scholarships";
import { eitHealthValidationSource } from "./eit-health-validation";
import { euFundingTendersSource } from "./eu-funding-tenders";
import { extendedResearchSources } from "./extended-research-careers";
import { euraxessSource } from "./euraxess";
import { fapespFellowshipsSource } from "./fapesp-fellowships";
import { grantsGovSource } from "./grants-gov";
import { greenhouseSources } from "./greenhouse";
import { hkuResearchCareersSource } from "./hong-kong-research-careers";
import { hospitalResearchSources } from "./hospital-research-careers";
import { ianPotterMedicalResearchSource } from "./ian-potter-medical-research";
import { institutionFeedSources } from "./institution-feeds";
import { lifeArcSource } from "./lifearc";
import { maxPlanckSource } from "./max-planck";
import { mayoClinicResearchSource } from "./mayo-clinic-research";
import { nhsJobsSource } from "./nhs-jobs";
import { neurologicalFoundationSource } from "./nz-neurological-foundation";
import { pacificResearchCareerSources } from "./pacific-research-careers";
import { programmeRegistrySource } from "./programme-registry";
import { ritsumeikanScholarshipSource } from "./ritsumeikan-scholarship";
import { rmitMedicalScienceSource } from "./rmit-medical-science";
import { sydneyRtpSource } from "./sydney-rtp";
import { smartRecruitersSources } from "./smartrecruiters";
import { swissTphSource } from "./swiss-tph";
import type { OpportunitySourceConnector } from "./types";
import { ucasScholarshipsSource } from "./ucas-scholarships";
import { ukriMedicalResearchSource } from "./ukri-medical-research";
import { californiaResearchCareerSources } from "./university-california-research";
import { usaJobsSource } from "./usajobs";
import { wellcomeSource } from "./wellcome";
import { westlakeResearchCareersSource } from "./westlake-research-careers";

/** Every publisher Provenant reads automatically, in display order. */
export const opportunitySources: OpportunitySourceConnector[] = [
  daadScholarshipsSource, daadDoctoralSource,
  programmeRegistrySource,
  ucasScholarshipsSource,
  canberraScholarshipSource,
  ritsumeikanScholarshipSource,
  sydneyRtpSource,
  rmitMedicalScienceSource,
  fapespFellowshipsSource,
  grantsGovSource,
  euFundingTendersSource,
  wellcomeSource,
  lifeArcSource,
  ianPotterMedicalResearchSource,
  eitHealthValidationSource,
  ukriMedicalResearchSource,
  neurologicalFoundationSource,
  canadianCancerFundingSource,
  brainCanadaTrainingSource,
  euraxessSource,
  swissTphSource,
  ...continentalCareerSources,
  ...extendedResearchSources,
  cnrsResearchCareersSource,
  ...pacificResearchCareerSources,
  hkuResearchCareersSource,
  westlakeResearchCareersSource,
  ...smartRecruitersSources,
  mayoClinicResearchSource,
  ...hospitalResearchSources,
  maxPlanckSource,
  nhsJobsSource,
  ...institutionFeedSources,
  usaJobsSource,
  ...californiaResearchCareerSources,
  ...greenhouseSources,
];
