import { euFundingTendersSource } from "./eu-funding-tenders";
import { grantsGovSource } from "./grants-gov";
import { greenhouseSources } from "./greenhouse";
import { institutionFeedSources } from "./institution-feeds";
import { maxPlanckSource } from "./max-planck";
import { nhsJobsSource } from "./nhs-jobs";
import type { OpportunitySourceConnector } from "./types";
import { usaJobsSource } from "./usajobs";

/** Every publisher Provenant reads automatically, in display order. */
export const opportunitySources: OpportunitySourceConnector[] = [
  grantsGovSource,
  euFundingTendersSource,
  maxPlanckSource,
  nhsJobsSource,
  ...institutionFeedSources,
  usaJobsSource,
  ...greenhouseSources,
];
