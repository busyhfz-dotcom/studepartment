import { canberraScholarshipSource } from "./canberra-scholarship";
import { cnrsResearchCareersSource } from "./cnrs-research-careers";
import { continentalCareerSources } from "./continental-careers";
import { daadScholarshipsSource, daadDoctoralSource } from "./scholarships";
import { eitHealthValidationSource } from "./eit-health-validation";
import { euFundingTendersSource } from "./eu-funding-tenders";
import { euraxessSource } from "./euraxess";
import { fapespFellowshipsSource } from "./fapesp-fellowships";
import { grantsGovSource } from "./grants-gov";
import { greenhouseSources } from "./greenhouse";
import { ianPotterMedicalResearchSource } from "./ian-potter-medical-research";
import { institutionFeedSources } from "./institution-feeds";
import { lifeArcSource } from "./lifearc";
import { maxPlanckSource } from "./max-planck";
import { nhsJobsSource } from "./nhs-jobs";
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
import { usaJobsSource } from "./usajobs";
import { wellcomeSource } from "./wellcome";

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
  euraxessSource,
  swissTphSource,
  ...continentalCareerSources,
  cnrsResearchCareersSource,
  ...pacificResearchCareerSources,
  ...smartRecruitersSources,
  maxPlanckSource,
  nhsJobsSource,
  ...institutionFeedSources,
  usaJobsSource,
  ...greenhouseSources,
];
