import assert from "node:assert/strict";

const baseUrl = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";

async function page(path) {
  const response = await fetch(baseUrl + path, { redirect: "manual" });
  assert.equal(response.status, 200, `${path} must render without redirecting`);
  return response.text();
}

for (const path of ["/start", "/main-site", "/discover"]) {
  const html = await page(path);
  assert.match(html, /href="\/start"/, "brand must link to the entry page");
  assert.match(html, /href="\/main-site"[^>]*>Main site</, "Main site link must exist");
  assert.match(html, /href="\/auth\/sign-in"[^>]*>Join free</, "Join free must share the sign-in route");
}

for (let attempt = 0; attempt < 2; attempt++) {
  const browse = await page("/start?step=browse&kind=grant&q=oncology&country=DE");
  assert.match(browse, /<em>grants<\/em>/, "refresh must retain the grant browsing step");
  assert.match(browse, /value="oncology"/, "refresh must retain the search term");
  const institutions = await page("/start?step=institutions");
  assert.match(institutions, /Bring an opportunity to the research community/, "refresh must retain the institution step");
}

const feed = await fetch(baseUrl + "/api/v1/opportunities?limit=1").then((response) => response.json());
assert.equal(feed.success, true);
const opportunity = feed.data.results[0];
if (opportunity) {
  const id = encodeURIComponent(opportunity.id);
  for (const step of ["detail", "next"]) {
    const html = await page(`/start?step=${step}&opportunity=${id}`);
    assert.match(html, /Loading opportunity details/, "a refreshed detail route must restore its listing");
    assert.doesNotMatch(html, /What are you looking for/, "detail routes must not reset to entry");
  }
  const restored = await fetch(baseUrl + `/api/v1/opportunities?id=${id}&includeStale=true&limit=1`).then((response) => response.json());
  assert.equal(restored.success, true);
  assert.equal(restored.data.results.length, 1);
  assert.equal(restored.data.results[0].id, opportunity.id, "refresh must retrieve the selected listing");
}

const missing = await fetch(baseUrl + "/api/v1/opportunities?id=nonexistent-navigation-smoke&limit=1").then((response) => response.json());
assert.equal(missing.success, true);
assert.equal(missing.data.results.length, 0, "unknown IDs must never return an unrelated listing");
console.log("Navigation and direct-refresh smoke checks passed.");
