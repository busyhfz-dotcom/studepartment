import { daadScholarshipsSource, daadDoctoralSource } from "./scholarships";
import { euFundingTendersSource } from "./eu-funding-tenders";
import { euraxessSource } from "./euraxess";
import { grantsGovSource } from "./grants-gov";
import { greenhouseSources } from "./greenhouse";
import { institutionFeedSources } from "./institution-feeds";
import { lifeArcSource } from "./lifearc";
import { maxPlanckSource } from "./max-planck";
import { nhsJobsSource } from "./nhs-jobs";
import { programmeRegistrySource } from "./programme-registry";
import type { OpportunitySourceConnector } from "./types";
import { ucasScholarshipsSource } from "./ucas-scholarships";
import { usaJobsSource } from "./usajobs";
import { wellcomeSource } from "./wellcome";

/** Every publisher Provenant reads automatically, in display order. */
export const opportunitySources: OpportunitySourceConnector[] = [
  daadScholarshipsSource, daadDoctoralSource,
  programmeRegistrySource,
  ucasScholarshipsSource,
  grantsGovSource,
  euFundingTendersSource,
  wellcomeSource,
  lifeArcSource,
  euraxessSource,
  maxPlanckSource,
  nhsJobsSource,
  ...institutionFeedSources,
  usaJobsSource,
  ...greenhouseSources,
];
