import { countries } from "@/lib/countries";
import type { OpportunityIngestionRecord } from "../ingestion";

type PositionType = Exclude<OpportunityIngestionRecord["type"], "GRANT" | "COLLABORATION">;

/**
 * Terms that place a listing in medicine, health or the biomedical sciences.
 * Matched on whole-word stems so that, e.g., "medicine" matches but
 * "immediate" does not.
 */
const MEDICAL_PATTERN = new RegExp(
  "\\b(" + [
    "medic(?:al|ine|inal)", "clinic(?:al|ian|s)?", "health", "healthcare", "biomedic\\w*", "biomed", "patient\\w*", "hospital\\w*",
    "cancer\\w*", "oncolog\\w*", "tumou?r\\w*", "leuka?emi\\w*", "lymphoma\\w*", "carcinoma\\w*", "metasta\\w*",
    "immun\\w*", "infect\\w*", "vaccin\\w*", "virus\\w*", "viral", "virolog\\w*", "bacteri\\w*", "microbio\\w*", "antimicrobial\\w*", "pathogen\\w*",
    "hiv", "aids", "tuberculosis", "malaria", "sepsis", "covid\\w*", "pandemic\\w*",
    "neuro\\w*", "brain", "alzheimer\\w*", "parkinson\\w*", "dementia", "stroke", "psychiatr\\w*", "mental health", "depress\\w*",
    "cardio\\w*", "cardiac", "heart", "vascular", "diabet\\w*", "obesity", "metabolic", "kidney", "renal", "liver", "hepat\\w*", "lung", "pulmonar\\w*", "respiratory",
    "disease\\w*", "therap\\w*", "drug\\w*", "pharma\\w*", "toxicolog\\w*", "diagnos\\w*", "surg\\w*", "radiolog\\w*", "patholog\\w*",
    "epidemiolog\\w*", "biostatist\\w*", "public health", "global health", "nurs\\w*", "midwi\\w*", "dental", "dentist\\w*", "physiotherap\\w*", "rehabilitat\\w*",
    "pediatric\\w*", "paediatric\\w*", "neonat\\w*", "maternal", "pregnan\\w*", "reproductive", "ageing", "aging",
    "genom\\w*", "genetic\\w*", "molecular biology", "cell biology", "stem cell\\w*", "physiolog\\w*", "biochem\\w*", "bioinformatic\\w*", "computational biology",
    "biomarker\\w*", "translational", "clinical trial\\w*",
  ].join("|") + ")\\b",
  "i",
);

/** Listings that mention medical words only in passing (e.g. "health insurance"). */
const MEDICAL_FALSE_FRIENDS = /\b(health insurance|occupational health and safety|health and safety|healthy work|wellbeing benefits?|(?:soil|plant|crop|forest|ocean|ecosystem|animal|financial|economic) health|health of (?:ecosystems|soils?|plants|forests|oceans))\b/gi;

export function isMedicalText(...parts: Array<string | null | undefined>): boolean {
  const text = parts.filter(Boolean).join(" ").replace(MEDICAL_FALSE_FRIENDS, " ");
  return MEDICAL_PATTERN.test(text);
}

/** Classifies a research position from its title. Returns null for roles we do not list. */
export function classifyPositionTitle(title: string): PositionType | null {
  const value = title.toLowerCase();
  if (/\b(consultant|matron|nurse practitioner|physician assistant|secretary|accountant)\b/.test(value)) return null;
  if (/\b(professor|lecturer|faculty|director|head of|dean|chair\b|manager|administrat|coordinator|officer|assistant to|secretary|accountant|engineer(?!ing)|technologist|nurse practitioner|physician assistant)\b/.test(value)
    && !/\b(post-?doc|postdoctoral|ph\.?d|doctoral|fellowship|research fellow)\b/.test(value)) {
    return null;
  }
  if (/\b(post-?docs?|postdoctoral|post-doctoral)\b/.test(value)) return "POSTDOC";
  if (/\b(ph\.?\s?d|doctoral (student|candidate|researcher|position|fellow)s?|predoctoral|pre-doctoral|doctorand\w*|studentship|doctoral training)\b/.test(value)) return "PHD";
  // In the UK a "clinical research fellow" is a doctor in a research post,
  // usually towards a doctorate: a fellowship, not a postdoc.
  if (/\bclinical research fellows?\b/.test(value)) return "FELLOWSHIP";
  if (/\bresearch fellows?\b/.test(value)) return "POSTDOC";
  if (/\bfellowships?\b/.test(value)) return "FELLOWSHIP";
  // Assistant and associate posts only; senior "Scientist" roles are staff
  // positions this index does not list.
  if (/\b(research (assistants?|associates?|technicians?)|lab(oratory)? (technician|research assistant))\b/.test(value)) {
    return "RESEARCH_ASSISTANTSHIP";
  }
  return null;
}

/** Career stages a position is aimed at, using the slugs the career filter understands. */
export function careerStagesForPosition(type: PositionType, text: string): string[] {
  const value = text.toLowerCase();
  if (type === "PHD") return ["phd"];
  if (type === "POSTDOC") return ["postdoc"];
  if (type === "FELLOWSHIP") {
    if (/\b(predoctoral|pre-doctoral|doctoral student|ph\.?d student|graduate student)\b/.test(value)) return ["phd"];
    if (/\b(postdoctoral|post-doctoral|postdoc)\b/.test(value)) return ["postdoc"];
    if (/\b(early[- ]career|junior investigator|new investigator)\b/.test(value)) return ["early-career-researcher"];
  }
  return [];
}

const TOPIC_RULES: Array<[string, RegExp]> = [
  ["oncology", /\b(cancer|oncolog\w*|tumou?r\w*|leuka?emi\w*|lymphoma|carcinoma|melanoma|glioma|sarcoma|myeloma)\b/i],
  ["cancer-immunotherapy", /\b(immunotherap\w*|car[- ]?t\b|checkpoint inhibit\w*|cancer vaccine\w*)\b/i],
  ["immunology", /\b(immun\w*|autoimmun\w*|inflammat\w*|t[- ]cells?|b[- ]cells?|antibod\w*)\b/i],
  ["genomics", /\b(genom\w*|genetic\w*|sequencing|crispr|gene editing|epigenet\w*|transcriptom\w*)\b/i],
  ["rare-diseases", /\b(rare disease\w*|orphan disease\w*)\b/i],
  ["epidemiology", /\b(epidemiolog\w*|cohort stud\w*|population stud\w*)\b/i],
  ["public-health", /\b(public health|population health|global health|health equity|health disparit\w*|prevention)\b/i],
  ["nursing", /\b(nurs\w*|midwi\w*)\b/i],
  ["medical-imaging", /\b(imaging|radiolog\w*|\bmri\b|\bpet\b|ultrasound|tomograph\w*|microscop\w*)\b/i],
  ["neuroscience", /\b(neuro\w*|brain|alzheimer\w*|parkinson\w*|dementia|cognit\w*|epilep\w*)\b/i],
  ["cardiovascular-medicine", /\b(cardio\w*|cardiac|heart|vascular|stroke|hypertension|atheroscler\w*)\b/i],
  ["infectious-diseases", /\b(infect\w*|vaccin\w*|virus\w*|viral|bacteri\w*|antimicrobial\w*|pathogen\w*|hiv|tuberculosis|malaria|sepsis|covid\w*)\b/i],
  ["pharmacology", /\b(pharmacolog\w*|drug (discovery|development)|pharmaceut\w*|therapeutic\w*|toxicolog\w*)\b/i],
  ["bioinformatics", /\b(bioinformatic\w*|computational biolog\w*|systems biolog\w*)\b/i],
  ["biomedical-engineering", /\b(biomedical engineering|medical device\w*|biomaterial\w*|tissue engineering|bioengineering)\b/i],
  ["health-informatics", /\b(health informatics|digital health|electronic health record\w*|clinical informatics|health data)\b/i],
  ["mental-health", /\b(mental health|psychiatr\w*|depress\w*|anxiety|schizophren\w*|substance use|addiction)\b/i],
  ["pediatrics", /\b(pediatric\w*|paediatric\w*|child health|children'?s health|neonat\w*|adolescent\w*)\b/i],
  ["reproductive-health", /\b(reproductive|maternal|pregnan\w*|fertility|obstetric\w*|gynaecolog\w*|gynecolog\w*)\b/i],
  ["rehabilitation", /\b(rehabilitat\w*|physiotherap\w*|physical therap\w*|occupational therap\w*)\b/i],
  ["health-services-research", /\b(health services|health system\w*|health ?care delivery|quality of care|health policy)\b/i],
  ["clinical-trials", /\b(clinical trial\w*|randomi[sz]ed controlled)\b/i],
  ["translational-research", /\b(translational|bench[- ]to[- ]bedside)\b/i],
  ["biomarkers", /\b(biomarker\w*)\b/i],
];

const METHOD_RULES: Array<[string, RegExp]> = [
  ["machine-learning", /\b(machine learning|deep learning|artificial intelligence|\bai\b|neural network\w*)\b/i],
  ["single-cell-analysis", /\b(single[- ]cell)\b/i],
  ["spatial-transcriptomics", /\b(spatial transcriptomic\w*|spatial omics)\b/i],
  ["genome-sequencing", /\b(genome sequencing|whole[- ]genome|next[- ]generation sequencing|\bngs\b)\b/i],
  ["flow-cytometry", /\b(flow cytometr\w*|facs)\b/i],
  ["medical-image-analysis", /\b(image analysis|medical image\w*|computer vision)\b/i],
  ["biostatistics", /\b(biostatist\w*|statistical genetics)\b/i],
  ["clinical-trial-design", /\b(trial design|adaptive trial\w*)\b/i],
  ["systematic-review", /\b(systematic review\w*)\b/i],
  ["meta-analysis", /\b(meta-analys\w*)\b/i],
  ["qualitative-research", /\b(qualitative research|qualitative method\w*|interview stud\w*)\b/i],
  ["cohort-studies", /\b(cohort stud\w*|longitudinal cohort)\b/i],
  ["implementation-science", /\b(implementation science|implementation research)\b/i],
  ["patient-reported-outcomes", /\b(patient[- ]reported outcome\w*|\bproms?\b)\b/i],
  ["health-economic-evaluation", /\b(health econom\w*|cost[- ]effectiveness)\b/i],
];

export function topicSlugsFor(text: string): string[] {
  return TOPIC_RULES.filter(([, pattern]) => pattern.test(text)).map(([slug]) => slug).slice(0, 6);
}

export function methodSlugsFor(text: string): string[] {
  return METHOD_RULES.filter(([, pattern]) => pattern.test(text)).map(([slug]) => slug).slice(0, 4);
}

const COUNTRY_ALIASES: Array<[string, string]> = [
  ["USA", "US"], ["U.S.", "US"], ["United States of America", "US"], ["UK", "GB"], ["England", "GB"], ["Scotland", "GB"], ["Wales", "GB"],
  ["Northern Ireland", "GB"], ["Great Britain", "GB"], ["Deutschland", "DE"], ["The Netherlands", "NL"], ["Holland", "NL"], ["Czech Republic", "CZ"],
  ["South Korea", "KR"], ["Korea", "KR"], ["Russia", "RU"], ["Türkiye", "TR"], ["Turkey", "TR"], ["Hong Kong", "HK"], ["Taiwan", "TW"],
];

const US_STATES = /\b(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming|, (?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC))\b/;

const countryNamePatterns = [...countries.map(([code, name]) => [name, code] as const), ...COUNTRY_ALIASES]
  .filter(([name]) => name.length > 3 || /^[A-Z.]+$/.test(name))
  .sort((a, b) => b[0].length - a[0].length)
  .map(([name, code]) => [new RegExp(`(^|[^\\p{L}])${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}]|$)`, "u"), code] as const);

/** Best-effort country from a free-text location. Returns null when unsure. */
export function countryCodeFromText(text: string | null | undefined): string | null {
  if (!text) return null;
  // US states first, so "New Jersey" is not read as the island of Jersey.
  if (US_STATES.test(text)) return "US";
  for (const [pattern, code] of countryNamePatterns) {
    if (pattern.test(text)) return code;
  }
  return null;
}
