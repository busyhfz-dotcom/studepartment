import { isValidOrcid, normalizeOrcid } from "@/server/integrations/orcid/orcid-id";

export const researchProfileSources = [
  { key: "orcid", name: "ORCID", entryUrl: "https://orcid.org/signin", description: "Your researcher identifier and public research record." },
  { key: "googleScholar", name: "Google Scholar", entryUrl: "https://scholar.google.com/citations", description: "Your author profile and scholarly publications." },
  { key: "researchGate", name: "ResearchGate", entryUrl: "https://www.researchgate.net/login", description: "Your research profile, publications and collaborations." },
  { key: "linkedin", name: "LinkedIn", entryUrl: "https://www.linkedin.com/login", description: "Your professional experience and career profile." },
  { key: "github", name: "GitHub", entryUrl: "https://github.com/login", description: "Your code, research software and project portfolio." },
] as const;

export type ResearchProfileSourceKey = typeof researchProfileSources[number]["key"];

/** External links never imply authenticated ownership or automatic data import. */
export function researchProfileUrl(key: ResearchProfileSourceKey, value?: string | null) {
  if (!value?.trim()) return undefined;
  if (key === "orcid") return isValidOrcid(value) ? `https://orcid.org/${normalizeOrcid(value)}` : undefined;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password) return undefined;
    return url.href;
  } catch { return undefined; }
}

export function pubmedSearchUrl(name?: string) {
  const url = new URL("https://pubmed.ncbi.nlm.nih.gov/");
  if (name?.trim()) url.searchParams.set("term", `${name.trim()}[Author]`);
  return url.href;
}
