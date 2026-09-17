import type { DiscoveryAvailability, ResearcherDiscoveryQuery } from "@/lib/api-contracts";

const allowedAvailability = new Set<DiscoveryAvailability>(["open", "selective", "quiet", "closed"]);

function cleanList(values: string[], maxItems = 8) {
  return Array.from(
    new Set(
      values
        .flatMap((value) => value.split(","))
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).slice(0, maxItems);
}

function readList(searchParams: URLSearchParams, key: string) {
  return cleanList(searchParams.getAll(key));
}

function readLimit(searchParams: URLSearchParams) {
  const raw = Number(searchParams.get("limit") ?? 6);
  if (!Number.isFinite(raw)) return 6;
  return Math.max(1, Math.min(12, Math.trunc(raw)));
}

export function parseResearcherDiscoveryQuery(searchParams: URLSearchParams): ResearcherDiscoveryQuery {
  const text = (searchParams.get("q") ?? "").trim().slice(0, 240);
  const availability = readList(searchParams, "availability").filter(
    (value): value is DiscoveryAvailability => allowedAvailability.has(value as DiscoveryAvailability),
  );

  return {
    text,
    topicSlugs: readList(searchParams, "topic"),
    methodSlugs: readList(searchParams, "method"),
    countryCodes: readList(searchParams, "country").map((value) => value.toUpperCase().slice(0, 2)),
    careerStages: readList(searchParams, "career"),
    availability,
    limit: readLimit(searchParams),
  };
}

export function tokenizeDiscoveryText(text: string) {
  return Array.from(
    new Set(
      text
        .toLocaleLowerCase("en")
        .normalize("NFKC")
        .split(/[^\p{L}\p{N}]+/u)
        .map((token) => token.trim())
        .filter((token) => token.length >= 2),
    ),
  ).slice(0, 16);
}
