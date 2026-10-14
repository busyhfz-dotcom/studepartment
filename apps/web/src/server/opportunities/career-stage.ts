import type { OpportunityCareerStage } from "@/lib/api-contracts";

/**
 * Eligibility slugs that count as open to each career stage in the
 * Opportunity Intelligence filter. Kept in line with the aliases used when
 * evaluating a profile's career stage against published eligibility.
 */
const stageSlugs: Record<OpportunityCareerStage, string[]> = {
  student: ["student"],
  phd: ["phd", "phd-student", "doctoral-researcher"],
  postdoc: ["postdoc"],
  "early-career-researcher": ["early-career-researcher"],
  faculty: ["faculty", "professor"],
};

export function careerStageFilterSlugs(stage: OpportunityCareerStage): string[] {
  return stageSlugs[stage];
}
