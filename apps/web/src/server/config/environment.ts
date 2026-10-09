import { isOrcidConfigured } from "@/server/integrations/orcid/client";

export type DeploymentEnvironment = "development" | "test" | "ci" | "staging" | "production";

export type CoreRuntimeConfig = {
  deploymentEnvironment: DeploymentEnvironment;
  databaseUrl: string;
  betterAuthSecret: string;
  betterAuthUrl: string;
  releaseSha?: string;
  authIpHeader: string;
  trustedProxies: string[];
};

export class EnvironmentConfigurationError extends Error {
  constructor(readonly issues: string[]) {
    super("Invalid runtime configuration: " + issues.join(" "));
    this.name = "EnvironmentConfigurationError";
  }
}

function deploymentEnvironment(): DeploymentEnvironment {
  const raw = process.env.DEPLOYMENT_ENV?.trim().toLowerCase();
  if (raw === "test" || raw === "ci" || raw === "staging" || raw === "production" || raw === "development") {
    return raw;
  }
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

function required(name: string, issues: string[]) {
  const value = process.env[name]?.trim();
  if (!value) issues.push(name + " is required.");
  return value ?? "";
}

function validHttpUrl(name: string, value: string, issues: string[], requireHttps: boolean) {
  if (!value) return;
  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) issues.push(name + " must use http or https.");
    if (requireHttps && parsed.protocol !== "https:") issues.push(name + " must use https in production.");
  } catch {
    issues.push(name + " must be a valid absolute URL.");
  }
}

let cached: CoreRuntimeConfig | null = null;

export function getCoreRuntimeConfig(): CoreRuntimeConfig {
  if (cached) return cached;
  const issues: string[] = [];
  const environment = deploymentEnvironment();
  const databaseUrl = required("DATABASE_URL", issues);
  const betterAuthSecret = required("BETTER_AUTH_SECRET", issues);
  const betterAuthUrl = required("BETTER_AUTH_URL", issues);

  if (betterAuthSecret && betterAuthSecret.length < 32) {
    issues.push("BETTER_AUTH_SECRET must be at least 32 characters.");
  }
  validHttpUrl("BETTER_AUTH_URL", betterAuthUrl, issues, environment === "production");

  const authIpHeader = process.env.AUTH_IP_HEADER?.trim().toLowerCase() || "x-forwarded-for";
  if (!/^[a-z0-9-]+$/.test(authIpHeader)) issues.push("AUTH_IP_HEADER contains invalid characters.");

  const trustedProxies = (process.env.AUTH_TRUSTED_PROXIES ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (issues.length) throw new EnvironmentConfigurationError(issues);

  cached = {
    deploymentEnvironment: environment,
    databaseUrl,
    betterAuthSecret,
    betterAuthUrl,
    releaseSha: process.env.RELEASE_SHA?.trim() || process.env.VERCEL_GIT_COMMIT_SHA?.trim() || undefined,
    authIpHeader,
    trustedProxies,
  };
  return cached;
}

export function integrationConfiguration() {
  return {
    orcid: isOrcidConfigured(),
    pubmed: Boolean(process.env.NCBI_EUTILS_EMAIL?.trim()),
    semanticRetrieval: Boolean(process.env.OPENAI_API_KEY?.trim()),
    researchAssistant: Boolean(process.env.OPENAI_API_KEY?.trim()),
    opportunityIngestion: Boolean(process.env.OPPORTUNITY_INGEST_TOKEN?.trim()),
    weeklyDigestJob: Boolean(process.env.DIGEST_JOB_TOKEN?.trim()),
    emailDelivery: Boolean(process.env.RESEND_API_KEY?.trim() && process.env.DIGEST_FROM_EMAIL?.trim()),
  };
}
