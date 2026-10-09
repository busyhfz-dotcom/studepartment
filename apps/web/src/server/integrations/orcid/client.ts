export type OrcidEnvironment = "sandbox" | "production";

export type OrcidConfig = {
  environment: OrcidEnvironment;
  apiType: "member" | "public";
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  publicApiUrl: string;
};

export type OrcidTokenIdentity = {
  orcid: string;
  accessToken: string;
  name?: string;
  scope?: string;
};

export class OrcidConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrcidConfigurationError";
  }
}

export class OrcidExchangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrcidExchangeError";
  }
}

export function getOrcidConfig(): OrcidConfig {
  const clientId = process.env.ORCID_CLIENT_ID?.trim();
  const clientSecret = process.env.ORCID_CLIENT_SECRET?.trim();
  const siteUrl = process.env.BETTER_AUTH_URL?.trim();
  const redirectUri = process.env.ORCID_REDIRECT_URI?.trim() || (siteUrl ? new URL("/api/integrations/orcid/callback", siteUrl).href : undefined);
  if (!clientId || !clientSecret || !redirectUri) {
    throw new OrcidConfigurationError(
      "ORCID_CLIENT_ID, ORCID_CLIENT_SECRET, and ORCID_REDIRECT_URI are required for ORCID verification.",
    );
  }

  const environment = process.env.ORCID_ENVIRONMENT?.trim() || "production";
  const apiType = process.env.ORCID_API_TYPE?.trim() || "member";
  if (apiType !== "member" && apiType !== "public") throw new OrcidConfigurationError("ORCID_API_TYPE must be member or public.");
  if (environment !== "production" && environment !== "sandbox") throw new OrcidConfigurationError("ORCID_ENVIRONMENT must be production or sandbox.");
  try {
    const callback = new URL(redirectUri);
    if (!["http:", "https:"].includes(callback.protocol)
      || (environment === "production" && callback.protocol !== "https:")
      || callback.username || callback.password || callback.hash || callback.search
      || callback.pathname !== "/api/integrations/orcid/callback"
      || (siteUrl && callback.origin !== new URL(siteUrl).origin)) {
      throw new Error("Invalid callback");
    }
  } catch { throw new OrcidConfigurationError("ORCID redirect must match this site's HTTPS callback URL."); }
  const host = environment === "production" ? "https://orcid.org" : "https://sandbox.orcid.org";

  return {
    environment,
    apiType,
    clientId,
    clientSecret,
    redirectUri,
    authorizationUrl: `${host}/oauth/authorize`,
    tokenUrl: `${host}/oauth/token`,
    publicApiUrl: `https://${apiType === "member" ? "api" : "pub"}.${environment === "sandbox" ? "sandbox." : ""}orcid.org/v3.0`,
  };
}

export function isOrcidConfigured() {
  try { getOrcidConfig(); return true; }
  catch { return false; }
}

export function buildOrcidAuthorizationUrl(config: OrcidConfig, state: string) {
  const url = new URL(config.authorizationUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "/authenticate");
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", state);
  return url;
}

export async function exchangeOrcidAuthorizationCode(
  config: OrcidConfig,
  code: string,
): Promise<OrcidTokenIdentity> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new OrcidExchangeError(`ORCID token exchange failed with HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  if (typeof payload.orcid !== "string" || !payload.orcid || typeof payload.access_token !== "string" || !payload.access_token) {
    throw new OrcidExchangeError("ORCID did not return an authenticated iD.");
  }

  return {
    orcid: payload.orcid,
    accessToken: payload.access_token,
    name: typeof payload.name === "string" ? payload.name : undefined,
    scope: typeof payload.scope === "string" ? payload.scope : undefined,
  };
}


type OrcidPublicToken = {
  clientKey: string;
  accessToken: string;
  expiresAt: number;
};

let publicTokenCache: OrcidPublicToken | null = null;

export type OrcidWorkSummary = {
  putCode: string;
  title: string;
  journal?: string;
  type?: string;
  publicationDate?: string;
  url?: string;
  doi?: string;
  pmid?: string;
  pmcid?: string;
  sourceName?: string;
};

function nestedValue(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  return typeof record.value === "string" ? record.value.trim() || undefined : undefined;
}

function parseOrcidDate(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const year = nestedValue(record.year);
  if (!year) return undefined;
  const month = nestedValue(record.month)?.padStart(2, "0");
  const day = nestedValue(record.day)?.padStart(2, "0");
  return [year, month, day].filter(Boolean).join("-");
}

function normalizeExternalIdentifier(type: string, value: string) {
  const normalizedType = type.trim().toLowerCase();
  let normalizedValue = value.trim();
  if (normalizedType === "doi") {
    normalizedValue = normalizedValue
      .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
      .toLowerCase();
  }
  if (normalizedType === "pmid") normalizedValue = normalizedValue.replace(/^pmid:\s*/i, "");
  if (normalizedType === "pmcid") normalizedValue = normalizedValue.toUpperCase();
  return { type: normalizedType, value: normalizedValue };
}

async function getOrcidPublicToken(config: OrcidConfig) {
  const clientKey = `${config.environment}:${config.apiType}:${config.clientId}`;
  if (publicTokenCache?.clientKey === clientKey && publicTokenCache.expiresAt > Date.now() + 60_000) {
    return publicTokenCache.accessToken;
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "client_credentials",
    scope: "/read-public",
  });
  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new OrcidExchangeError(`ORCID public token request failed with HTTP ${response.status}.`);
  }

  const payload = await response.json() as Record<string, unknown>;
  if (typeof payload.access_token !== "string" || !payload.access_token) {
    throw new OrcidExchangeError("ORCID did not return a public API access token.");
  }
  const expiresIn = typeof payload.expires_in === "number" ? payload.expires_in : 3600;
  publicTokenCache = {
    clientKey,
    accessToken: payload.access_token,
    expiresAt: Date.now() + Math.max(300, expiresIn) * 1000,
  };
  return publicTokenCache.accessToken;
}

export async function fetchOrcidRecord(orcid: string, accessToken?: string): Promise<Record<string, unknown>> {
  const config = getOrcidConfig();
  const token = accessToken || await getOrcidPublicToken(config);
  const response = await fetch(`${config.publicApiUrl}/${encodeURIComponent(orcid)}/record`, {
    headers: { accept: "application/vnd.orcid+json", authorization: `Bearer ${token}` },
    cache: "no-store", signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new OrcidExchangeError(`ORCID record request failed with HTTP ${response.status}.`);
  return await response.json() as Record<string, unknown>;
}

export async function fetchPublicOrcidWorks(orcid: string): Promise<OrcidWorkSummary[]> {
  const config = getOrcidConfig();
  const token = await getOrcidPublicToken(config);
  const response = await fetch(`${config.publicApiUrl}/${encodeURIComponent(orcid)}/works`, {
    headers: {
      accept: "application/vnd.orcid+json",
      authorization: `Bearer ${token}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new OrcidExchangeError(`ORCID works request failed with HTTP ${response.status}.`);
  }

  const payload = await response.json() as Record<string, unknown>;
  return parseOrcidWorks(payload);
}

export function parseOrcidWorks(payload: Record<string, unknown>): OrcidWorkSummary[] {
  const groups = Array.isArray(payload.group) ? payload.group : [];
  const works: OrcidWorkSummary[] = [];

  for (const group of groups) {
    if (!group || typeof group !== "object") continue;
    const summaries = (group as Record<string, unknown>)["work-summary"];
    if (!Array.isArray(summaries) || !summaries.length) continue;

    const summary = summaries.find((item) => item && typeof item === "object" && (!(item as Record<string, unknown>).visibility || (item as Record<string, unknown>).visibility === "PUBLIC"));
    if (!summary || typeof summary !== "object") continue;
    const record = summary as Record<string, unknown>;
    const putCodeRaw = record["put-code"];
    const putCode = typeof putCodeRaw === "number" || typeof putCodeRaw === "string" ? String(putCodeRaw) : "";
    if (!putCode) continue;

    const titleRecord = record.title && typeof record.title === "object"
      ? record.title as Record<string, unknown>
      : {};
    const title = nestedValue(titleRecord.title);
    if (!title) continue;

    const externalIdsRecord = record["external-ids"] && typeof record["external-ids"] === "object"
      ? record["external-ids"] as Record<string, unknown>
      : {};
    const externalIds = Array.isArray(externalIdsRecord["external-id"]) ? externalIdsRecord["external-id"] : [];
    const identifiers = new Map<string, string>();

    for (const externalId of externalIds) {
      if (!externalId || typeof externalId !== "object") continue;
      const external = externalId as Record<string, unknown>;
      const type = nestedValue(external["external-id-type"]) ?? (typeof external["external-id-type"] === "string" ? external["external-id-type"] : undefined);
      const value = nestedValue(external["external-id-value"]) ?? (typeof external["external-id-value"] === "string" ? external["external-id-value"] : undefined);
      if (!type || !value) continue;
      const normalized = normalizeExternalIdentifier(type, value);
      if (normalized.value) identifiers.set(normalized.type, normalized.value);
    }

    const journalRecord = record["journal-title"];
    const sourceRecord = record.source && typeof record.source === "object"
      ? record.source as Record<string, unknown>
      : {};
    const sourceNameRecord = sourceRecord["source-name"];

    works.push({
      putCode,
      title,
      journal: nestedValue(journalRecord),
      type: typeof record.type === "string" ? record.type : undefined,
      publicationDate: parseOrcidDate(record["publication-date"]),
      url: nestedValue(record.url),
      doi: identifiers.get("doi"),
      pmid: identifiers.get("pmid"),
      pmcid: identifiers.get("pmcid"),
      sourceName: nestedValue(sourceNameRecord),
    });
  }

  return works.slice(0, 100);
}
