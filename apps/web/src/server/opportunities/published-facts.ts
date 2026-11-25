import { countryName } from "@/lib/countries";

const swissCancer = "cancerresearch.ch/for-researchers/funding-opportunities/research-grants";
const cruk = "cancerresearchuk.org/for-researchers/apply-for-and-manage-your-funding/our-funding-schemes/";
const erc = "https://erc.europa.eu/system/files/2025-09/erc-2025-stg-statistics.pdf";

export function publishedFacts(sourceUrl: string, metadata: unknown, countries: string[]) {
  const data = metadata && typeof metadata === "object" ? metadata as Record<string, unknown> : {};
  const swiss = sourceUrl.includes(swissCancer);
  const region = typeof data.eligibilityRegion === "string" ? data.eligibilityRegion : null;
  const geography = countries.map(code => countryName(code) ?? code).join(", ");
  const summary = typeof data.eligibilitySummary === "string" ? data.eligibilitySummary.trim().slice(0, 340) : "";
  const publishedEligibility = summary || region || geography || (swiss ? "Independent researchers at Swiss research institutions" : undefined);
  const isProgramme = sourceUrl.includes(cruk + "early-detection-diagnosis-programme-award");
  const isPrimer = sourceUrl.includes(cruk + "early-detection-diagnosis-primer-award");
  const starting = /^https:\/\/(?:[^/]+\.)?(?:ec\.europa\.eu|erc\.europa\.eu)\//.test(sourceUrl) && /(?:erc-20\d\d-stg|\/starting-grant)(?:[/?#]|$)/i.test(sourceUrl);
  const report = isProgramme ? { rate: 20, basis: "Five-year funding rate, 2021–2026", url: sourceUrl }
    : isPrimer ? { rate: 42, basis: "Five-year funding rate, 2020–2025", url: sourceUrl }
    : starting ? { rate: 12.2, basis: "2025 ERC Starting Grant selection rate", url: erc } : undefined;
  const competition = report ? {
    ...report,
    label: report.rate < 15 ? "Very competitive" : report.rate < 35 ? "Competitive" : "Less selective",
  } : undefined;
  return { publishedEligibility, competition, swiss };
}
