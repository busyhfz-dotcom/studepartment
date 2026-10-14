import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const baseUrl = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";

async function request(path, init = {}) {
  return fetch(baseUrl + path, {
    redirect: "manual",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.headers || {}),
    },
  });
}

const live = await request("/api/health/live");
assert.equal(live.status, 200, "liveness endpoint must return 200");
const liveBody = await live.json();
assert.equal(liveBody.status, "ok");

const ready = await request("/api/health/ready");
assert.equal(ready.status, 200, "readiness endpoint must return 200 against migrated PostgreSQL");
const readyBody = await ready.json();
assert.equal(readyBody.status, "ready");
assert.equal(readyBody.database, "ready");

const page = await fetch(baseUrl + "/auth/sign-in", { redirect: "manual" });
assert.equal(page.status, 200, "sign-in page must render");
for (const header of ["x-content-type-options", "x-frame-options", "referrer-policy", "content-security-policy"]) {
  assert.ok(page.headers.get(header), "missing security header: " + header);
}
const csp = page.headers.get("content-security-policy") || "";
assert.match(csp, /nonce-[^']+/i, "CSP must contain a per-request nonce");
assert.match(csp, /frame-ancestors 'none'/, "CSP must deny framing");

async function verifyInteractivePage(path) {
  const response = await fetch(baseUrl + path, { redirect: "manual" });
  assert.equal(response.status, 200, `${path} must render directly`);
  const policy = response.headers.get("content-security-policy") || "";
  const nonce = policy.match(/'nonce-([^']+)'/)?.[1];
  assert.ok(nonce, `${path} must receive a nonce policy`);
  assert.ok(!/s-maxage/i.test(response.headers.get("cache-control") || ""), `${path} must not cache HTML with request-specific nonces`);
  const html = await response.text();
  const scripts = [...html.matchAll(/<script\b([^>]*)>/gi)]
    .map((match) => match[1])
    .filter((attributes) => !/\btype\s*=\s*["']application\/(?:ld\+)?json["']/i.test(attributes));
  assert.ok(scripts.length > 0, `${path} must include its interactive bootstrap`);
  for (const attributes of scripts) {
    const scriptNonce = attributes.match(/\bnonce\s*=\s*["']([^"']+)["']/i)?.[1];
    assert.equal(scriptNonce, nonce, `${path} contains a script blocked by its own CSP`);
  }
  return nonce;
}

for (const path of ["/start", "/main-site", "/discover", "/discover/labs", "/discover/institutions", "/opportunities"]) {
  await verifyInteractivePage(path);
}
const firstDiscoveryNonce = await verifyInteractivePage("/discover");
const refreshedDiscoveryNonce = await verifyInteractivePage("/discover");
assert.notEqual(firstDiscoveryNonce, refreshedDiscoveryNonce, "refreshing discovery must generate a fresh nonce");

const anonymousMe = await request("/api/v1/me");
assert.equal(anonymousMe.status, 401, "anonymous /api/v1/me must return 401");

const anonymousAssistant = await request("/api/v1/assistant/research", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ question: "Which researchers overlap my work?" }),
});
assert.equal(anonymousAssistant.status, 401, "anonymous Research Assistant must return 401");

const anonymousExport = await request("/api/v1/account/export");
assert.equal(anonymousExport.status, 401, "anonymous account export must return 401");

const anonymousFeedback = await request("/api/v1/feedback");
assert.equal(anonymousFeedback.status, 401, "anonymous feedback read must return 401");

const email = "ci-" + randomUUID() + "@example.test";
const password = "CI-Strong-Password-" + randomUUID();
const signup = await request("/api/auth/sign-up/email", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Origin: baseUrl,
  },
  body: JSON.stringify({ name: "CI Researcher", email, password }),
});
if (!signup.ok) {
  const detail = await signup.text();
  throw new Error("Better Auth signup failed with HTTP " + signup.status + ": " + detail.slice(0, 500));
}

const setCookie = signup.headers.get("set-cookie");
assert.ok(setCookie, "signup response must set a session cookie");
const cookie = setCookie.split(";")[0];

const me = await request("/api/v1/me", {
  headers: { Cookie: cookie },
});
assert.equal(me.status, 200, "authenticated /api/v1/me must return 200");
const meBody = await me.json();
assert.equal(meBody.success, true);
assert.ok(meBody.data?.id, "authenticated identity must resolve to canonical User.id");

const profile = await request("/api/v1/profile", {
  headers: { Cookie: cookie },
});
assert.equal(profile.status, 200, "authenticated profile read must return 200");
const profileBody = await profile.json();
assert.equal(profileBody.success, true);
assert.equal(profileBody.data.profilePublic, false, "new profiles must be private before any edits");
assert.ok(profileBody.data?.id, "profile read must resolve an owned ResearcherProfile");

// A migrated database must support the real profile choices without demo seeding.
const topicSlugs = ["oncology", "cancer-immunotherapy", "biomarkers", "clinical-trials", "computational-oncology", "rare-diseases", "epidemiology", "nursing", "medical-imaging"];
const methodSlugs = ["clinical-trial-design", "translational-research", "biomarker-analysis", "machine-learning", "systematic-review", "qualitative-research"];
const profileUpdate = await request("/api/v1/profile", {
  method: "PATCH",
  headers: { Cookie: cookie, Origin: baseUrl, "Content-Type": "application/json" },
  body: JSON.stringify({ topicSlugs, methodSlugs, profilePublic: false, profileDetails: { unlistedInstitution: "CI Medical Research Unit" } }),
});
assert.equal(profileUpdate.status, 200, "canonical topics and methods must save without running demo seed");
const updatedProfile = await request("/api/v1/profile", { headers: { Cookie: cookie } });
assert.equal(updatedProfile.status, 200);
const updatedProfileBody = await updatedProfile.json();
assert.deepEqual([...updatedProfileBody.data.topicSlugs].sort(), [...topicSlugs].sort(), "saved topics must survive a new profile read");
assert.deepEqual([...updatedProfileBody.data.methodSlugs].sort(), [...methodSlugs].sort(), "saved methods must survive a new profile read");
assert.equal(updatedProfileBody.data.profilePublic, false);
assert.equal(updatedProfileBody.data.institution, "CI Medical Research Unit (self-reported)");
assert.equal(updatedProfileBody.data.verification.find((item) => item.label === "Institution").verified, false);

const publicProfile = await request("/researchers/" + updatedProfileBody.data.id);
assert.equal(publicProfile.status, 404, "private scientific identities must not be publicly exposed");

const evidenceReview = await request("/api/v1/assistant/research", { method: "POST", headers: { Cookie: cookie, Origin: baseUrl, "Content-Type": "application/json" }, body: JSON.stringify({ question: "Review my nursing and medical imaging research context and methods." }) });
assert.equal(evidenceReview.status, 200, "saved medical context must be usable by the structured assistant");
const evidenceReviewBody = await evidenceReview.json();
assert.equal(evidenceReviewBody.success, true);
assert.ok(evidenceReviewBody.data.citations.some((citation) => citation.type === "identity" && /Nursing/.test(citation.detail)), "the assistant must use the saved topics as identity evidence");

const visibilityOptIn = await request("/api/v1/profile", { method: "PATCH", headers: { Cookie: cookie, Origin: baseUrl, "Content-Type": "application/json" }, body: JSON.stringify({ profilePublic: true }) });
assert.equal(visibilityOptIn.status, 200);
const optedInProfile = await request("/researchers/" + updatedProfileBody.data.id);
assert.equal(optedInProfile.status, 200);
assert.match(await optedInProfile.text(), /CI Medical Research Unit \(self-reported\)/, "an explicitly public profile must display its unlisted affiliation as self-reported");
const unrelatedEdit = await request("/api/v1/profile", { method: "PATCH", headers: { Cookie: cookie, Origin: baseUrl, "Content-Type": "application/json" }, body: JSON.stringify({ city: "CI Test City" }) });
assert.equal(unrelatedEdit.status, 200);
const preservedVisibility = await request("/api/v1/profile", { headers: { Cookie: cookie } });
assert.equal((await preservedVisibility.json()).data.profilePublic, true, "unrelated edits must preserve existing visibility choices");

const recoveryPage = await fetch(baseUrl + "/auth/forgot-password");
assert.equal(recoveryPage.status, 200);
if (!readyBody.integrations?.emailDelivery) {
  assert.match(await recoveryPage.text(), /email delivery is not enabled/i);
  const recovery = await request("/api/auth/request-password-reset", { method: "POST", headers: { Origin: baseUrl, "Content-Type": "application/json" }, body: JSON.stringify({ email, redirectTo: baseUrl + "/auth/reset-password" }) });
  assert.equal(recovery.status, 503, "disabled email must not pretend to send a reset link");
}

const marketingPage = await fetch(baseUrl + "/main-site");
const marketingHtml = await marketingPage.text();
assert.doesNotMatch(marketingHtml, /Nordic Biomedical Graduate School|Pacific Genomics Foundation|Live from Studepartment|Refreshed continuously from verified sources/);
assert.match(marketingHtml, /What is available today/);

console.log("Runtime smoke checks passed.");
