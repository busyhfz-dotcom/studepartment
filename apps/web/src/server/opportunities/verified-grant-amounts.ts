type Facts = { awardMin?: number; awardMax?: number; awardCurrency?: string; awardNote?: string };

const ukri = "https://www.ukri.org/opportunity/";
const canada = "https://cancer.ca/en/research/for-researchers/funding-opportunities/";

const facts: Record<string, Facts> = {
  [ukri + "ukri-translation-mrc-impact-acceleration-awards"]: { awardMin: 50_000, awardMax: 300_000, awardCurrency: "GBP" },
  [ukri + "wearables-and-observables-understanding-home-learning-environment"]: { awardMin: 500_000, awardMax: 900_000, awardCurrency: "GBP", awardNote: "UKRI lists the full economic cost range and funds 80%." },
  [ukri + "mid-range-equipment-for-biosciences-research-alert-2026"]: { awardMin: 200_000, awardMax: 1_500_000, awardCurrency: "GBP" },
  [ukri + "centres-of-excellence-for-regulatory-science-and-innovation"]: { awardMax: 5_000_000, awardCurrency: "GBP", awardNote: "Maximum contribution per centre over five years." },
  [ukri + "uk-obesity-research-institute"]: { awardMax: 72_000_000, awardCurrency: "GBP", awardNote: "Maximum MRC contribution over seven years." },
  [ukri + "mrc-proof-of-concept-stage-one"]: { awardNote: "UKRI states that there is no fixed funding limit." },
  [ukri + "mrc-proof-of-concept-stage-two"]: { awardNote: "UKRI states that there is no fixed funding limit." },
  [ukri + "experimental-medicine"]: { awardNote: "UKRI states that there is no upper funding limit." },
  [ukri + "experimental-medicine-invited-stage-two-application"]: { awardNote: "UKRI states that there is no upper funding limit." },
  [canada + "2027-ecr-grants"]: { awardMax: 300_000, awardCurrency: "CAD", awardNote: "Maximum CAD 150,000 in a single year." },
  [canada + "2027-wcr-grants"]: { awardMax: 300_000, awardCurrency: "CAD", awardNote: "Maximum CAD 150,000 in a single year." },
  [canada + "2027-he-grants"]: { awardMax: 600_000, awardCurrency: "CAD", awardNote: "Community-engaged research stream. Partnership development has a separate CAD 150,000 ceiling." },
  "https://eithealth.eu/opportunity/innovation-validation": { awardMax: 850_000, awardCurrency: "EUR", awardNote: "EIT Health funds up to 50% of the total project budget." },
  "https://wellcome.org/research-funding/schemes/wellcome-early-career-awards": { awardMax: 400_000, awardCurrency: "GBP", awardNote: "Research expenses ceiling. Salary and eligible exceptions are separate." },
  "https://wellcome.org/research-funding/schemes/wellcome-discovery-awards": { awardNote: "The funder publishes a GBP 3.5 million average. Proposals above GBP 5 million receive additional scrutiny." },
};

export function verifiedGrantAmounts(url?: string) {
  return url ? facts[url.split(/[?#]/, 1)[0].replace(/\/$/, "")] : undefined;
}
