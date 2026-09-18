const issues = [];
const env = (process.env.DEPLOYMENT_ENV || (process.env.NODE_ENV === "production" ? "production" : "development")).trim().toLowerCase();
const allowed = new Set(["development", "test", "ci", "staging", "production"]);

if (!allowed.has(env)) issues.push("DEPLOYMENT_ENV must be development, test, ci, staging, or production.");

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) issues.push(name + " is required.");
  return value || "";
}

function url(name, value, httpsRequired = false) {
  if (!value) return;
  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) issues.push(name + " must use http or https.");
    if (httpsRequired && parsed.protocol !== "https:") issues.push(name + " must use https.");
  } catch {
    issues.push(name + " must be a valid absolute URL.");
  }
}

const databaseUrl = required("DATABASE_URL");
const authSecret = required("BETTER_AUTH_SECRET");
const authUrl = required("BETTER_AUTH_URL");

if (authSecret && authSecret.length < 32) issues.push("BETTER_AUTH_SECRET must be at least 32 characters.");
url("BETTER_AUTH_URL", authUrl, env === "production");

if (databaseUrl && !databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
  issues.push("DATABASE_URL must be a PostgreSQL connection URL.");
}

const orcid = {
  id: process.env.ORCID_CLIENT_ID?.trim() || "",
  secret: process.env.ORCID_CLIENT_SECRET?.trim() || "",
  redirect: process.env.ORCID_REDIRECT_URI?.trim() || "",
  environment: process.env.ORCID_ENVIRONMENT?.trim() || "",
};
const anyOrcid = Boolean(orcid.id || orcid.secret || orcid.redirect);
if (anyOrcid && !(orcid.id && orcid.secret && orcid.redirect)) {
  issues.push("ORCID_CLIENT_ID, ORCID_CLIENT_SECRET, and ORCID_REDIRECT_URI must be configured together.");
}
if (orcid.redirect) url("ORCID_REDIRECT_URI", orcid.redirect, env === "production");
if (env === "production" && anyOrcid && orcid.environment !== "production") {
  issues.push("ORCID_ENVIRONMENT must be production when ORCID is enabled in production.");
}

const ncbiEmail = process.env.NCBI_EUTILS_EMAIL?.trim() || "";
if (process.env.NCBI_API_KEY?.trim() && !ncbiEmail) {
  issues.push("NCBI_EUTILS_EMAIL is required when NCBI_API_KEY is configured.");
}
if (ncbiEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ncbiEmail)) {
  issues.push("NCBI_EUTILS_EMAIL must be a valid contact email.");
}

const ingestToken = process.env.OPPORTUNITY_INGEST_TOKEN?.trim() || "";
if (ingestToken && ingestToken.length < 32) {
  issues.push("OPPORTUNITY_INGEST_TOKEN must be at least 32 characters when configured.");
}

if (issues.length) {
  console.error("Environment validation failed:");
  for (const issue of issues) console.error(" - " + issue);
  process.exit(1);
}

console.log("Environment validation passed for " + env + ".");
console.log(JSON.stringify({
  environment: env,
  orcidConfigured: anyOrcid,
  pubmedConfigured: Boolean(ncbiEmail),
  semanticRetrievalConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
  opportunityIngestionConfigured: Boolean(ingestToken),
}));
