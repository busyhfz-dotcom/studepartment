import type { OpportunityCareerStage, OpportunityQuery, OpportunityTypeValue } from "@/lib/api-contracts";
import { readOpportunityPage, readOpportunitySort } from "@/lib/opportunity-pagination";

const allowedCareerStages = new Set<OpportunityCareerStage>([
  "student",
  "phd",
  "postdoc",
  "early-career-researcher",
  "faculty",
]);

function readCareerStage(searchParams: URLSearchParams): OpportunityCareerStage | undefined {
  const value = (searchParams.get("career") ?? "").trim().toLowerCase();
  return allowedCareerStages.has(value as OpportunityCareerStage) ? value as OpportunityCareerStage : undefined;
}

const allowedTypes = new Set<OpportunityTypeValue>([
  "masters-scholarship", "phd-scholarship",
  "phd",
  "postdoc",
  "fellowship",
  "grant",
  "collaboration",
  "research-assistantship",
]);

function cleanList(values: string[], maxItems = 8) {
  return Array.from(new Set(
    values.flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean),
  )).slice(0, maxItems);
}

function readList(searchParams: URLSearchParams, key: string) {
  return cleanList(searchParams.getAll(key));
}

function readLimit(searchParams: URLSearchParams) {
  const raw = Number(searchParams.get("limit") ?? 12);
  if (!Number.isFinite(raw)) return 12;
  return Math.max(1, Math.min(24, Math.trunc(raw)));
}

function readDeadlineWindow(searchParams: URLSearchParams) {
  const raw = searchParams.get("deadlineWithinDays");
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return Math.max(1, Math.min(365, Math.trunc(value)));
}

export function parseOpportunityQuery(searchParams: URLSearchParams): OpportunityQuery {
  const careerStage = readCareerStage(searchParams);
  const funder = searchParams.get("funder")?.trim().slice(0, 120);
  const sourceRecordId = searchParams.get("sourceRecordId")?.trim().slice(0, 128);
  const eligibilityCountry = searchParams.get("eligibilityCountry")?.trim().toUpperCase();
  return {
    ...(searchParams.get("id") ? { id: searchParams.get("id")!.trim().slice(0, 128) } : {}),
    text: (searchParams.get("q") ?? "").trim().slice(0, 240),
    types: readList(searchParams, "type").filter(
      (value): value is OpportunityTypeValue => allowedTypes.has(value as OpportunityTypeValue),
    ),
    topicSlugs: readList(searchParams, "topic"),
    methodSlugs: readList(searchParams, "method"),
    countryCodes: readList(searchParams, "country").map((value) => value.toUpperCase().slice(0, 2)),
    deadlineWithinDays: readDeadlineWindow(searchParams),
    includeStale: searchParams.get("includeStale") === "true",
    limit: readLimit(searchParams),
    ...(searchParams.has("page") ? { page: readOpportunityPage(searchParams.get("page")), sort: readOpportunitySort(searchParams.get("sort")) } : {}),
    ...(careerStage ? { careerStage } : {}),
    ...(funder ? { funder } : {}),
    ...(sourceRecordId ? { sourceRecordId } : {}),
    ...(eligibilityCountry && /^[A-Z]{2}$/.test(eligibilityCountry) ? { eligibilityCountry } : {}),
  };
}
