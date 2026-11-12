import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";

process.env.DEPLOYMENT_ENV = "test";
process.env.DATABASE_URL ??= "postgresql://test:test@127.0.0.1:5432/test";
process.env.BETTER_AUTH_SECRET ??= "security-hardening-test-secret-0123456789";
process.env.BETTER_AUTH_URL = "https://provenant.example";
process.env.AUTH_IP_HEADER = "cf-connecting-ip,x-forwarded-for";

const source = (path: string) => readFileSync(new URL("../src/" + path, import.meta.url), "utf8");
const apiRequest = (method: string, headers: Record<string, string> = {}) =>
  new NextRequest("https://provenant.example/api/v1/account", { method, headers });

test("a write to the API from another site is refused before it reaches a route", async () => {
  const { proxy } = await import("../src/proxy");
  assert.equal(proxy(apiRequest("DELETE", { origin: "https://evil.example" })).status, 403);
  assert.equal(proxy(apiRequest("POST", { origin: "null" })).status, 403);
  assert.equal(proxy(apiRequest("PATCH", { "sec-fetch-site": "cross-site" })).status, 403);
  assert.equal(proxy(apiRequest("PUT", { "sec-fetch-site": "same-site" })).status, 403);
});

test("same-origin writes, reads and non-browser clients still pass", async () => {
  const { proxy } = await import("../src/proxy");
  assert.equal(proxy(apiRequest("DELETE", { origin: "https://provenant.example" })).status, 200);
  assert.equal(proxy(apiRequest("POST", { "sec-fetch-site": "same-origin" })).status, 200);
  assert.equal(proxy(apiRequest("POST")).status, 200);
  assert.equal(proxy(apiRequest("GET", { origin: "https://evil.example" })).status, 200);
});

test("pages may only load images from this origin", async () => {
  const { proxy } = await import("../src/proxy");
  const csp = proxy(new NextRequest("https://provenant.example/opportunities")).headers.get("content-security-policy") ?? "";
  assert.match(csp, /img-src 'self' blob: data:(;|$)/);
});

test("a rate-limit bucket follows the network address, not a header the caller chooses", async () => {
  const { clientFingerprint, clientAddress } = await import("../src/server/security/rate-limit");
  const request = (headers: Record<string, string>) => new NextRequest("https://provenant.example/api/v1/opportunities", { headers });
  const base = { "cf-connecting-ip": "198.51.100.7" };
  assert.equal(
    clientFingerprint(request({ ...base, "user-agent": "one" })),
    clientFingerprint(request({ ...base, "user-agent": "two" })),
  );
  // The proxy-set header wins over a forwarded-for value the client supplied.
  assert.equal(clientAddress(request({ ...base, "x-forwarded-for": "203.0.113.9" }).headers), "198.51.100.7");
  assert.equal(clientAddress(request({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" }).headers), "203.0.113.9");
  assert.notEqual(clientFingerprint(request(base)), clientFingerprint(request({ "cf-connecting-ip": "198.51.100.8" })));
});

test("an unverified institution cannot publish straight to search or link off its own site", () => {
  const route = source("app/api/v1/organization/opportunities/route.ts");
  assert.match(route, /status: publicStatus\(organization\.verified\)/);
  assert.doesNotMatch(route, /status: "ACTIVE", title/);
  assert.match(route, /if \(!organization\.website\) return apiError\(400/);
  assert.match(route, /!organization\.verified && !onInstitutionSite\(applicationUrl, websiteHost\)/);
  // Renaming or re-pointing a verified institution drops its verification.
  assert.match(source("server/repositories/organization-repository.ts"), /identityChanged \? \{ verified: false \}/);
});

test("anonymous interface translation cannot spend the Research Assistant allowance", () => {
  const route = source("app/api/v1/interface-translations/route.ts");
  assert.doesNotMatch(route, /assistant-global-(minute|day)/);
  assert.match(route, /translation-global-day/);
});

test("ingestion only stores web links", () => {
  const ingestion = source("server/opportunities/ingestion.ts");
  assert.match(ingestion, /const sourceUrl = webUrl\(received\.sourceUrl\);\s+if \(!sourceUrl\) continue;/);
});
