import assert from "node:assert/strict";

const baseUrl = process.env.SMOKE_BASE_URL?.replace(/\/$/, "");
if (!baseUrl) {
  console.error("SMOKE_BASE_URL is required.");
  process.exit(1);
}

const live = await fetch(baseUrl + "/api/health/live", { cache: "no-store" });
assert.equal(live.status, 200, "liveness must return 200");

const ready = await fetch(baseUrl + "/api/health/ready", { cache: "no-store" });
assert.equal(ready.status, 200, "readiness must return 200");
const readyBody = await ready.json();
assert.equal(readyBody.status, "ready");
assert.equal(readyBody.database, "ready");

const page = await fetch(baseUrl + "/auth/sign-in", { redirect: "manual" });
assert.equal(page.status, 200, "sign-in page must render");
for (const header of [
  "x-content-type-options",
  "x-frame-options",
  "referrer-policy",
  "content-security-policy",
  "strict-transport-security",
]) {
  assert.ok(page.headers.get(header), "missing production security header: " + header);
}
const csp = page.headers.get("content-security-policy") || "";
assert.match(csp, /nonce-[^']+/i);
assert.match(csp, /frame-ancestors 'none'/);

const me = await fetch(baseUrl + "/api/v1/me", {
  headers: { Accept: "application/json" },
  cache: "no-store",
});
assert.equal(me.status, 401, "anonymous private API must return 401");

const assistant = await fetch(baseUrl + "/api/v1/assistant/research", {
  method: "POST",
  headers: { Accept: "application/json", "Content-Type": "application/json" },
  body: JSON.stringify({ question: "Which current opportunities overlap my identity?" }),
  cache: "no-store",
});
assert.equal(assistant.status, 401, "anonymous Research Assistant must return 401");

const accountExport = await fetch(baseUrl + "/api/v1/account/export", {
  headers: { Accept: "application/json" },
  cache: "no-store",
});
assert.equal(accountExport.status, 401, "anonymous account export must return 401");

const feedback = await fetch(baseUrl + "/api/v1/feedback", {
  headers: { Accept: "application/json" },
  cache: "no-store",
});
assert.equal(feedback.status, 401, "anonymous feedback read must return 401");

console.log("Deployment smoke checks passed for " + baseUrl);
