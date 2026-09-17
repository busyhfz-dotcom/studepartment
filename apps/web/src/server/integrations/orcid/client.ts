export type OrcidEnvironment = "sandbox" | "production";

export type OrcidConfig = {
  environment: OrcidEnvironment;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
};

export type OrcidTokenIdentity = {
  orcid: string;
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
  const redirectUri = process.env.ORCID_REDIRECT_URI?.trim();
  if (!clientId || !clientSecret || !redirectUri) {
    throw new OrcidConfigurationError(
      "ORCID_CLIENT_ID, ORCID_CLIENT_SECRET, and ORCID_REDIRECT_URI are required for ORCID verification.",
    );
  }

  const environment: OrcidEnvironment =
    process.env.ORCID_ENVIRONMENT === "production" ? "production" : "sandbox";
  const host = environment === "production" ? "https://orcid.org" : "https://sandbox.orcid.org";

  return {
    environment,
    clientId,
    clientSecret,
    redirectUri,
    authorizationUrl: `${host}/oauth/authorize`,
    tokenUrl: `${host}/oauth/token`,
  };
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
  });

  if (!response.ok) {
    throw new OrcidExchangeError(`ORCID token exchange failed with HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  if (typeof payload.orcid !== "string" || !payload.orcid) {
    throw new OrcidExchangeError("ORCID did not return an authenticated iD.");
  }

  return {
    orcid: payload.orcid,
    name: typeof payload.name === "string" ? payload.name : undefined,
    scope: typeof payload.scope === "string" ? payload.scope : undefined,
  };
}
