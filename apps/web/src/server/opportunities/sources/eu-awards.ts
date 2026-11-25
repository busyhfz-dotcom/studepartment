import { htmlToText } from "./text";

export type EuAward = {
  awardMin?: number;
  awardMax?: number;
  awardCurrency: "EUR";
  awardBasis?: "indicative";
  awardSource: string;
  awardNote?: string;
};

const detailOrigin = "https://ec.europa.eu/info/funding-tenders/opportunities/data/topicDetails/";

export function euTopicDetailsUrl(id: string) {
  return /^[a-z0-9-]+$/i.test(id) ? detailOrigin + id.toLowerCase() + ".json" : null;
}

type BudgetAction = { action?: string; minContribution?: unknown; maxContribution?: unknown };
type TopicPayload = {
  TopicDetails?: {
    identifier?: string;
    description?: string;
    budgetOverviewJSONItem?: { budgetTopicActionMap?: Record<string, BudgetAction[]> };
  };
};

function amount(value: unknown) {
  const parsed = typeof value === "number" || (typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value))
    ? Number(value) : NaN;
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 1e12 ? parsed : undefined;
}

/** Per-project contributions only. budgetYearMap is the whole call’s budget. */
export function euAwardsFromDetails(payload: TopicPayload): Record<string, EuAward> {
  const detail = payload.TopicDetails;
  const awards: Record<string, EuAward> = {};
  if (!detail) return awards;
  const actions = Object.values(detail.budgetOverviewJSONItem?.budgetTopicActionMap ?? {}).flat();
  const grouped = new Map<string, EuAward[]>();
  for (const item of actions) {
    const id = item.action?.split(" - ", 1)[0].trim().toUpperCase();
    if (!id || !euTopicDetailsUrl(id)) continue;
    const awardMin = amount(item.minContribution);
    const awardMax = amount(item.maxContribution);
    if ((!awardMin && !awardMax) || (awardMin && awardMax && awardMin > awardMax)) continue;
    const saved = grouped.get(id) ?? [];
    saved.push({ awardMin, awardMax, awardCurrency: "EUR", awardBasis: "indicative",
      awardSource: "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/" + id });
    grouped.set(id, saved);
  }
  for (const [id, group] of grouped) {
    // Several funding instruments sometimes share a topic. A single range is
    // displayed only when all instruments publish the same bounds.
    const [first] = group;
    if (group.every(item => item.awardMin === first.awardMin && item.awardMax === first.awardMax)) awards[id] = first;
  }
  const identifier = detail.identifier?.toUpperCase();
  if (identifier && /^ERC-\d{4}-(?:STG|COG|ADG)$/.test(identifier)) {
    const text = htmlToText(detail.description).replace(/\s+/g, " ");
    const ceiling = text.match(/(?:Starting|Consolidator|Advanced) Grants? may be awarded up to (?:a maximum of )?EUR ([1-9]\d{0,2}(?: \d{3}){1,3})\b/i)?.[1];
    const awardMax = amount(ceiling?.replaceAll(" ", ""));
    if (awardMax) awards[identifier] = { awardMax, awardCurrency: "EUR",
      awardSource: "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/" + identifier,
      awardNote: /additional funding.*can be requested/i.test(text) ? "Base grant. Additional funding has separate conditions." : undefined };
  }
  return awards;
}
