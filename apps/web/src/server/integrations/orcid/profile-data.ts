import type { IndividualProfileDetails, ProfileLinks, ProfileTimelineEntry } from "@/lib/api-contracts";
import { assertValidOrcid } from "./orcid-id";
import { parseOrcidWorks } from "./client";

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function list(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function text(value: unknown, limit = 240): string | undefined {
  const item = typeof value === "string" ? value : object(value).value;
  return typeof item === "string" ? item.trim().slice(0, limit) || undefined : undefined;
}
function publicItem(value: unknown) { return !object(value).visibility || object(value).visibility === "PUBLIC"; }
function date(value: unknown) {
  const item = object(value);
  return [text(item.year), text(item.month)?.padStart(2, "0")].filter(Boolean).join("-");
}
function timeline(value: unknown, kind: "employment" | "education", orcid: string): ProfileTimelineEntry[] {
  const groups = list(object(value)["affiliation-group"]);
  const summaries = groups.flatMap((group) => list(object(group).summaries).map((summary) => object(summary)[`${kind}-summary`]));
  return summaries.filter(publicItem).slice(0, 20).map((raw) => {
    const item = object(raw), organization = object(item.organization);
    return {
      title: text(item["role-title"]) || text(item["department-name"]) || (kind === "employment" ? "Research appointment" : "Education"),
      organization: text(organization.name),
      period: [date(item["start-date"]), date(item["end-date"])].filter(Boolean).join(" – ") || undefined,
      description: text(item["department-name"], 1200),
      url: `https://orcid.org/${orcid}`,
    };
  });
}

export function parseOrcidProfile(record: Record<string, unknown>, expectedOrcid: string) {
  const orcid = assertValidOrcid(expectedOrcid);
  if (object(record["orcid-identifier"]).path !== orcid) throw new Error("ORCID record identifier did not match the requested identity.");
  const person = object(record.person), name = object(person.name), activities = object(record["activities-summary"]);
  const links: ProfileLinks = {};
  for (const raw of list(object(person["researcher-urls"])["researcher-url"]).filter(publicItem)) {
    const href = text(object(raw).url, 2048);
    if (!href) continue;
    try {
      const url = new URL(href);
      if (url.protocol !== "https:" || url.username || url.password) continue;
      const host = url.hostname.toLowerCase();
      const key = host === "github.com" ? "github" : host === "scholar.google.com" ? "googleScholar"
        : host === "researchgate.net" || host.endsWith(".researchgate.net") ? "researchGate"
        : host === "linkedin.com" || host.endsWith(".linkedin.com") ? "linkedin" : "website";
      links[key] ??= url.href;
    } catch { /* A malformed source URL does not prevent importing other fields. */ }
  }
  const addresses = list(object(person.addresses).address).filter(publicItem);
  const country = text(object(addresses[0]).country);
  const keywords = Array.from(new Set(list(object(person.keywords).keyword).filter(publicItem).map((item) => text(object(item).content, 160)).filter((item): item is string => Boolean(item)))).slice(0, 40);
  return {
    orcid,
    fullName: publicItem(person.name) ? text(name["credit-name"], 160) || [text(name["given-names"]), text(name["family-name"])].filter(Boolean).join(" ").slice(0, 160) || undefined : undefined,
    bio: publicItem(person.biography) ? text(object(person.biography).content, 3000) : undefined,
    countryCode: country && /^[A-Z]{2}$/.test(country) ? country : undefined,
    experience: timeline(activities.employments, "employment", orcid),
    education: timeline(activities.educations, "education", orcid),
    keywords, links,
    works: parseOrcidWorks(object(activities.works)),
  };
}

export function mergeOrcidDetails(existing: IndividualProfileDetails, imported: ReturnType<typeof parseOrcidProfile>) {
  const links = { ...existing.links };
  for (const [key, value] of Object.entries(imported.links)) {
    if (!links[key as keyof ProfileLinks]) links[key as keyof ProfileLinks] = value;
  }
  return {
    ...existing, links,
    experience: existing.experience?.length ? existing.experience : imported.experience,
    education: existing.education?.length ? existing.education : imported.education,
    orcidKeywords: existing.orcidKeywords?.length ? existing.orcidKeywords : imported.keywords,
  };
}
