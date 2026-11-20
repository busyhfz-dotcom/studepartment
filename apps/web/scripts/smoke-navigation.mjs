import assert from "node:assert/strict";

const baseUrl = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";

async function page(path) {
  const response = await fetch(baseUrl + path, { redirect: "manual" });
  assert.equal(response.status, 200, `${path} must render without redirecting`);
  return response.text();
}

for (const path of ["/start", "/discover"]) {
  const html = await page(path);
  assert.match(html, /href="\/start"/, "brand must link to the entry page");
  if (path === "/start") {
    assert.doesNotMatch(html, /href="\/main-site"/);
    assert.match(html, /href="\/auth\/sign-in"[^>]*>Sign in</);
  } else {
    assert.doesNotMatch(html, />Join free</, "Join free belongs only on the entry page");
    assert.doesNotMatch(html, />Main site</, "Main site shortcut belongs only on the entry page");
  }
}
const retired = await fetch(baseUrl + "/main-site", { redirect: "manual" });
assert.equal(retired.status, 308);
assert.equal(new URL(retired.headers.get("location"), baseUrl).pathname, "/start");

for (let attempt = 0; attempt < 2; attempt++) {
  const browse = await page("/start?step=browse&kind=grant&q=oncology&country=DE");
  assert.match(browse, /Grants for group leaders/);
  assert.match(browse, /selected="" value="DE"|value="DE" selected=""/, "refresh must retain the country");
  assert.match(browse, /value="oncology"/, "refresh must retain the search term");
  const institutions = await page("/start?step=institutions");
  assert.match(institutions, /Introduce your lab’s next research opportunity/, "refresh must retain the institution step");
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
