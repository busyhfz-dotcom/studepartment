export type PubMedConfig = {
  email: string;
  apiKey?: string;
  tool: string;
};

export type PubMedSummary = {
  pmid: string;
  title: string;
  journal?: string;
  publicationDate?: string;
  publicationType?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  pmcid?: string;
  authorNames: string[];
  sourceUrl: string;
};

export class PubMedConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PubMedConfigurationError";
  }
}

export class PubMedRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PubMedRequestError";
  }
}

export function getPubMedConfig(): PubMedConfig {
  const email = process.env.NCBI_EUTILS_EMAIL?.trim();
  if (!email) {
    throw new PubMedConfigurationError("NCBI_EUTILS_EMAIL is required for PubMed enrichment.");
  }
  return {
    email,
    apiKey: process.env.NCBI_API_KEY?.trim() || undefined,
    tool: "studepartment",
  };
}

function withCommonParams(url: URL, config: PubMedConfig) {
  url.searchParams.set("tool", config.tool);
  url.searchParams.set("email", config.email);
  if (config.apiKey) url.searchParams.set("api_key", config.apiKey);
  return url;
}

function normalizeDoi(value: string) {
  return value.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").toLowerCase();
}

function articleIds(item: Record<string, unknown>) {
  const values = Array.isArray(item.articleids) ? item.articleids : [];
  const result = new Map<string, string>();
  for (const entry of values) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    if (typeof record.idtype === "string" && typeof record.value === "string") {
      result.set(record.idtype.toLowerCase(), record.value.trim());
    }
  }
  return result;
}

function parsePublicationDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const raw = value.trim();
  const match = raw.match(/^(\d{4})(?:\s+([A-Za-z]{3}))?(?:\s+(\d{1,2}))?/);
  if (!match) return undefined;
  const year = Number(match[1]);
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const month = match[2] ? monthNames.indexOf(match[2]) + 1 : 1;
  const day = match[3] ? Number(match[3]) : 1;
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  return new Date(Date.UTC(year, month - 1, day)).toISOString();
}

export async function searchPubMedPmidsByDois(dois: string[], config = getPubMedConfig()) {
  const normalizedDois = Array.from(new Set(dois.map(normalizeDoi).filter(Boolean))).slice(0, 50);
  if (!normalizedDois.length) return [] as string[];

  const query = normalizedDois.map((doi) => `"${doi}"[AID]`).join(" OR ");
  const url = withCommonParams(
    new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"),
    config,
  );
  url.searchParams.set("db", "pubmed");
  url.searchParams.set("retmode", "json");
  url.searchParams.set("retmax", "100");
  url.searchParams.set("term", query);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new PubMedRequestError(`PubMed ESearch failed with HTTP ${response.status}.`);

  const payload = await response.json() as Record<string, unknown>;
  const esearch = payload.esearchresult && typeof payload.esearchresult === "object"
    ? payload.esearchresult as Record<string, unknown>
    : {};
  return Array.isArray(esearch.idlist)
    ? esearch.idlist.filter((id): id is string => typeof id === "string")
    : [];
}

export async function fetchPubMedSummaries(pmids: string[], config = getPubMedConfig()): Promise<PubMedSummary[]> {
  const ids = Array.from(new Set(pmids.map((pmid) => pmid.trim()).filter(Boolean))).slice(0, 200);
  if (!ids.length) return [];

  const url = withCommonParams(
    new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"),
    config,
  );
  url.searchParams.set("db", "pubmed");
  url.searchParams.set("retmode", "json");
  url.searchParams.set("id", ids.join(","));

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new PubMedRequestError(`PubMed ESummary failed with HTTP ${response.status}.`);

  const payload = await response.json() as Record<string, unknown>;
  const result = payload.result && typeof payload.result === "object"
    ? payload.result as Record<string, unknown>
    : {};
  const uids = Array.isArray(result.uids) ? result.uids.filter((id): id is string => typeof id === "string") : ids;
  const summaries: PubMedSummary[] = [];

  for (const pmid of uids) {
    const raw = result[pmid];
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    if (typeof item.title !== "string" || !item.title.trim()) continue;
    const idsByType = articleIds(item);
    const authors = Array.isArray(item.authors)
      ? item.authors
          .map((author) => author && typeof author === "object" ? (author as Record<string, unknown>).name : undefined)
          .filter((name): name is string => typeof name === "string" && Boolean(name.trim()))
      : [];
    const pubTypes = Array.isArray(item.pubtype)
      ? item.pubtype.filter((value): value is string => typeof value === "string")
      : [];

    summaries.push({
      pmid,
      title: item.title.trim(),
      journal: typeof item.fulljournalname === "string"
        ? item.fulljournalname.trim() || undefined
        : typeof item.source === "string"
          ? item.source.trim() || undefined
          : undefined,
      publicationDate: parsePublicationDate(item.pubdate),
      publicationType: pubTypes[0],
      volume: typeof item.volume === "string" ? item.volume.trim() || undefined : undefined,
      issue: typeof item.issue === "string" ? item.issue.trim() || undefined : undefined,
      pages: typeof item.pages === "string" ? item.pages.trim() || undefined : undefined,
      doi: idsByType.get("doi") ? normalizeDoi(idsByType.get("doi")!) : undefined,
      pmcid: idsByType.get("pmc") ?? idsByType.get("pmcid"),
      authorNames: authors,
      sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    });
  }

  return summaries;
}
