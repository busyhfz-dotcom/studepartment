import assert from "node:assert/strict";
import test from "node:test";
import { safeReturnPath } from "../src/lib/navigation";
import { getOrcidConfig, buildOrcidAuthorizationUrl, OrcidConfigurationError, isOrcidConfigured } from "../src/server/integrations/orcid/client";
import { reviewAvailableEvidence } from "../src/server/assistant/evidence-review";

test("return destinations preserve selected work and reject external or malformed redirects", () => {
  assert.equal(safeReturnPath("/opportunities/saved?save=listing-123"), "/opportunities/saved?save=listing-123");
  assert.equal(safeReturnPath("/api/integrations/orcid/connect"), "/api/integrations/orcid/connect");
  for (const input of ["//evil.example", "/\\evil.example", "https://evil.example", "/\n/evil.example", undefined]) assert.equal(safeReturnPath(input, "/files"), "/files");
});

test("ORCID uses production by default and requires a callback belonging to this site", () => {
  const names = ["ORCID_CLIENT_ID", "ORCID_CLIENT_SECRET", "ORCID_REDIRECT_URI", "ORCID_ENVIRONMENT", "BETTER_AUTH_URL"];
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  try {
    for (const name of names) delete process.env[name];
    assert.equal(isOrcidConfigured(), false);
    assert.throws(getOrcidConfig, OrcidConfigurationError);
    process.env.ORCID_CLIENT_ID = "APP-test-client";
    process.env.ORCID_CLIENT_SECRET = "test-only-secret";
    process.env.BETTER_AUTH_URL = "https://studepartment.example";
    const config = getOrcidConfig();
    assert.equal(config.environment, "production");
    assert.equal(config.redirectUri, "https://studepartment.example/api/integrations/orcid/callback");
    const url = buildOrcidAuthorizationUrl(config, "test-state");
    assert.equal(url.origin, "https://orcid.org");
    assert.equal(url.searchParams.get("state"), "test-state");
    assert.equal(url.searchParams.get("scope"), "/authenticate");
    assert.equal(url.searchParams.get("redirect_uri"), config.redirectUri);
    assert(!url.href.includes("test-only-secret"));
    process.env.ORCID_REDIRECT_URI = "https://another.example/api/integrations/orcid/callback";
    assert.equal(isOrcidConfigured(), false);
    process.env.ORCID_REDIRECT_URI = "http://studepartment.example/api/integrations/orcid/callback";
    assert.equal(isOrcidConfigured(), false);
    delete process.env.ORCID_REDIRECT_URI;
    process.env.ORCID_ENVIRONMENT = "sandbox";
    assert.equal(getOrcidConfig().authorizationUrl, "https://sandbox.orcid.org/oauth/authorize");
  } finally { for (const name of names) previous[name] === undefined ? delete process.env[name] : process.env[name] = previous[name]; }
});

test("structured evidence review cites actual records and identifies unavailable evidence", () => {
  const citations = [{id:"S1",type:"identity" as const,label:"My identity",detail:"Recorded focus: oncology.",evidence:"asserted" as const,href:"/profile"}];
  const review = reviewAvailableEvidence("Which grants overlap oncology?", citations);
  assert.equal(review.mode, "evidence-review");
  assert.match(review.answer, /Recorded focus: oncology\. \[S1\]/);
  assert.match(review.answer, /No opportunity records are available/);
  assert.deepEqual(review.referencedCitationIds, ["S1"]);
  assert.deepEqual(review.citations, citations);
  assert(!review.answer.includes("eligible for"));
});
