import assert from "node:assert/strict";
import test from "node:test";
import { parseOrcidProfile, mergeOrcidDetails } from "../src/server/integrations/orcid/profile-data";
import { researchProfileSources, researchProfileUrl } from "../src/lib/research-profile-sources";
import { parseProfileUpdateInput } from "../src/server/validation/profile";
import { exchangeOrcidAuthorizationCode, fetchOrcidRecord, getOrcidConfig } from "../src/server/integrations/orcid/client";

const orcid = "0000-0002-1825-0097";
const record = {
  "orcid-identifier": { path: orcid },
  person: {
    name: { "given-names": { value: "Ada" }, "family-name": { value: "Researcher" }, visibility: "PUBLIC" },
    biography: { content: "Researching clinical evidence.", visibility: "PUBLIC" },
    addresses: { address: [{ country: { value: "GB" }, visibility: "PUBLIC" }] },
    keywords: { keyword: [{ content: "Oncology", visibility: "PUBLIC" }, { content: "Private topic", visibility: "PRIVATE" }] },
    "researcher-urls": { "researcher-url": [{ url: { value: "https://github.com/researcher" }, visibility: "PUBLIC" }, { url: { value: "javascript:alert(1)" } }] },
  },
  "activities-summary": {
    employments: { "affiliation-group": [{ summaries: [{ "employment-summary": { "role-title": "Research fellow", organization: { name: "Example University" }, "start-date": { year: { value: "2021" }, month: { value: "3" } }, visibility: "PUBLIC" } }] }] },
    educations: { "affiliation-group": [{ summaries: [{ "education-summary": { "role-title": "PhD", organization: { name: "Example University" }, visibility: "PUBLIC" } }] }] },
    works: { group: [{ "work-summary": [{ "put-code": 123, title: { title: { value: "A research paper" } }, "external-ids": { "external-id": [{ "external-id-type": "doi", "external-id-value": "10.1000/example" }] } }] }] },
  },
};

test("ORCID import maps public profile and activities without confusing source assertions with ownership", () => {
  const result = parseOrcidProfile(record, orcid);
  assert.equal(result.fullName, "Ada Researcher");
  assert.equal(result.bio, "Researching clinical evidence.");
  assert.equal(result.countryCode, "GB");
  assert.deepEqual(result.keywords, ["Oncology"]);
  assert.equal(result.experience[0].title, "Research fellow");
  assert.equal(result.experience[0].period, "2021-03");
  assert.equal(result.education[0].title, "PhD");
  assert.equal(result.links.github, "https://github.com/researcher");
  assert.equal(result.works[0].doi, "10.1000/example");
  assert.equal(result.works[0].title, "A research paper");
  assert(!("verified" in result));
  assert.throws(() => parseOrcidProfile({ ...record, "orcid-identifier": { path: "another-id" } }, orcid));
});

test("repeated imports preserve user edits and do not duplicate timeline entries", () => {
  const imported = parseOrcidProfile(record, orcid);
  const existing = { experience: [{ title: "My edited appointment" }], links: { github: "https://github.com/my-own-account" }, skills: ["My skill"] };
  const first = mergeOrcidDetails(existing, imported);
  const second = mergeOrcidDetails(first, imported);
  assert.deepEqual(first, second);
  assert.deepEqual(first.experience, existing.experience);
  assert.deepEqual(first.skills, existing.skills);
  assert.equal(first.links.github, existing.links.github);
  assert.equal(first.education.length, 1);
  assert.deepEqual(parseProfileUpdateInput({ profileDetails: second }).profileDetails?.orcidKeywords, ["Oncology"]);
});

test("provider entry links work without client credentials and invalid identifiers cannot form record links", () => {
  assert.equal(researchProfileSources.length, 5);
  assert(researchProfileSources.every((source) => new URL(source.entryUrl).protocol === "https:"));
  assert.equal(researchProfileUrl("orcid", `https://orcid.org/${orcid}`), `https://orcid.org/${orcid}`);
  assert.equal(researchProfileUrl("orcid", "invalid"), undefined);
  assert.equal(researchProfileUrl("github", "javascript:alert(1)"), undefined);
  assert.throws(() => parseProfileUpdateInput({ orcid: "invalid" }), /valid ORCID/);
});

test("authorized import uses the granted token on the Member API without requesting additional permissions", async () => {
  const names = ["ORCID_CLIENT_ID", "ORCID_CLIENT_SECRET", "ORCID_REDIRECT_URI", "ORCID_ENVIRONMENT", "ORCID_API_TYPE", "BETTER_AUTH_URL"];
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  try {
    for (const name of names) delete process.env[name];
    Object.assign(process.env, { ORCID_CLIENT_ID: "APP-test", ORCID_CLIENT_SECRET: "test-secret", BETTER_AUTH_URL: "https://studepartment.example" });
    globalThis.fetch = async (input, options) => {
      const url = String(input); calls.push(url);
      if (url === "https://orcid.org/oauth/token") {
        assert.equal(new URLSearchParams(String(options?.body)).get("grant_type"), "authorization_code");
        return new Response(JSON.stringify({ orcid, access_token: "test-granted-token", scope: "/authenticate" }), { status: 200 });
      }
      assert.equal(url, `https://api.orcid.org/v3.0/${orcid}/record`);
      assert.equal(new Headers(options?.headers).get("authorization"), "Bearer test-granted-token");
      return new Response(JSON.stringify(record), { status: 200 });
    };
    const identity = await exchangeOrcidAuthorizationCode(getOrcidConfig(), "test-code");
    const data = await fetchOrcidRecord(identity.orcid, identity.accessToken);
    assert.equal(parseOrcidProfile(data, orcid).works.length, 1);
    assert.equal(calls.length, 2);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) previous[name] === undefined ? delete process.env[name] : process.env[name] = previous[name];
  }
});
