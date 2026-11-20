import { canberraScholarshipSource } from "./canberra-scholarship";
import { daadScholarshipsSource, daadDoctoralSource } from "./scholarships";
import { eitHealthValidationSource } from "./eit-health-validation";
import { euFundingTendersSource } from "./eu-funding-tenders";
import { euraxessSource } from "./euraxess";
import { grantsGovSource } from "./grants-gov";
import { greenhouseSources } from "./greenhouse";
import { ianPotterMedicalResearchSource } from "./ian-potter-medical-research";
import { institutionFeedSources } from "./institution-feeds";
import { lifeArcSource } from "./lifearc";
import { maxPlanckSource } from "./max-planck";
import { nhsJobsSource } from "./nhs-jobs";
import { programmeRegistrySource } from "./programme-registry";
import { ritsumeikanScholarshipSource } from "./ritsumeikan-scholarship";
import { rmitMedicalScienceSource } from "./rmit-medical-science";
import { sydneyRtpSource } from "./sydney-rtp";
import { swissTphSource } from "./swiss-tph";
import type { OpportunitySourceConnector } from "./types";
import { ucasScholarshipsSource } from "./ucas-scholarships";
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
  grantsGovSource,
  euFundingTendersSource,
  wellcomeSource,
  lifeArcSource,
  ianPotterMedicalResearchSource,
  eitHealthValidationSource,
  euraxessSource,
  swissTphSource,
  maxPlanckSource,
  nhsJobsSource,
  ...institutionFeedSources,
  usaJobsSource,
  ...greenhouseSources,
];
