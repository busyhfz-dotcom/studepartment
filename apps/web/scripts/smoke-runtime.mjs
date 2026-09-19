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
assert.ok(profileBody.data?.id, "profile read must resolve an owned ResearcherProfile");

console.log("Runtime smoke checks passed.");
