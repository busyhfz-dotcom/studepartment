export const asiaOpportunityCountries = ["SG", "JP", "KR", "CN", "TW", "HK"] as const;
export const featuredCountries = ["US", "CA", "GB", "CH", "NL", "BE", "DE", "FR", "AT", "DK", "SE", "IT", "FI", ...asiaOpportunityCountries] as const;

const excludedAsianScanCountries = new Set("AF AM AZ BH BD BT BN KH GE IN ID IR IQ IL JO KZ KW KG LA LB MO MY MV MN MM NP KP OM PK PS PH QA RU SA LK SY TJ TH TL TR TM AE UZ VN YE".split(" "));

export function opportunityScanIncludes(country?: string | null) {
  return !country || !excludedAsianScanCountries.has(country.toUpperCase());
}

export const opportunityRegions = {
  EUROPE: { label: "Europe", countries: "AL AD AT BY BE BA BG HR CY CZ DK EE FI FR DE GR HU IS IE IT XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO SM RS SK SI ES SE CH TR UA GB VA".split(" ") },
  ASIA: { label: "Asia", countries: asiaOpportunityCountries },
  US_CA: { label: "US & Canada", countries: ["US", "CA"] },
} as const;

export function opportunityRegion(value: string | null) {
  return value && Object.hasOwn(opportunityRegions, value) ? value as keyof typeof opportunityRegions : undefined;
}

export const opportunitySubjects = [
  ["oncology", "Cancer & oncology"], ["cardiovascular-medicine", "Cardiovascular medicine"],
  ["neuroscience", "Neuroscience"], ["endocrinology-diabetes", "Endocrinology & diabetes"],
  ["immunology", "Immunology"], ["infectious-diseases", "Infectious diseases"],
  ["microbiology", "Microbiology"], ["parasitology", "Parasitology"], ["biochemistry", "Biochemistry"],
  ["molecular-cell-biology", "Molecular & cell biology"], ["genomics", "Genomics"],
  ["public-health", "Public health"], ["rare-diseases", "Rare diseases"],
  ["medical-imaging", "Medical imaging"], ["machine-learning", "AI & machine learning"],
  ["bioinformatics", "Bioinformatics"], ["health-informatics", "Health informatics"],
  ["biomedical-engineering", "Biomedical engineering"], ["pediatrics", "Pediatrics"],
  ["mental-health", "Mental health"], ["allied-health", "Allied health"], ["pharmacology", "Pharmacology"],
] as const;

export const positionRoles = {
  "tenure-track": { label: "Tenure-track", terms: ["tenure-track", "tenure track"] },
  "group-leader": { label: "Group leader", terms: ["group leader", "head of research group", "research group head", "lab head"] },
  "assistant-professor": { label: "Assistant professor", terms: ["assistant professor", "maître de conférences"] },
  "associate-professor": { label: "Associate professor", terms: ["associate professor", "professeur associé"] },
  "full-professor": { label: "Full professor", terms: ["full professor", "professor of", "professorship", "professeur des universités"] },
  "research-assistant": { label: "Research assistant", terms: ["research assistant", "assistant de recherche", "research technician"] },
  "research-associate": { label: "Research associate", terms: ["research associate", "research officer", "wissenschaftlicher mitarbeiter"] },
  "senior-scientist": { label: "Senior scientist", terms: ["senior scientist", "senior research scientist", "staff scientist", "principal scientist"] },
  "senior-postdoc": { label: "Senior postdoc", terms: ["senior postdoc", "senior postdoctoral", "senior research fellow"] },
  "postdoc-fellow": { label: "Postdoctoral fellow", terms: ["postdoctoral fellow", "post-doctoral fellow", "postdoc fellow"] },
} as const;

export function positionRole(value: string | null) {
  return value && Object.hasOwn(positionRoles, value) ? value as keyof typeof positionRoles : undefined;
}

export function positionRoleLabel(title: string) {
  const text = title.toLowerCase();
  return Object.values(positionRoles).find(role =>
    role.terms.some(term => new RegExp("(^|[^\\p{L}])" + term + "($|[^\\p{L}])", "u").test(text))
  )?.label;
}

export function deadlineClosingSoon(deadline?: string | null, precision?: string, now = Date.now()) {
  if (!deadline || !["exact", "date-only"].includes(precision ?? "")) return false;
  const gap = Date.parse(deadline) - now;
  return gap >= 0 && gap <= 7 * 86_400_000;
}
