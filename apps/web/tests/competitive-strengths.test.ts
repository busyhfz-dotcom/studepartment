import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { parseOpportunityQuery } from "../src/server/opportunities/query";
import { careerStageFilterSlugs } from "../src/server/opportunities/career-stage";
import { escapeHtml, isDeadlineDue } from "../src/server/digest/digest-format";
import { countries, countryName, isCountryCode } from "../src/lib/countries";
import robots from "../src/app/robots";
import sitemap from "../src/app/sitemap";
import { scannerCategories } from "../src/app/scanner/scanner-sources";
import { conferenceCategories } from "../src/app/conferences/conference-sources";

test("career-stage filter accepts only known stages and expands to eligibility aliases", () => {
  assert.equal(parseOpportunityQuery(new URLSearchParams("career=postdoc")).careerStage, "postdoc");
  assert.equal(parseOpportunityQuery(new URLSearchParams("career=PhD")).careerStage, "phd");
  assert.equal(parseOpportunityQuery(new URLSearchParams("career=astronaut")).careerStage, undefined);
  assert.equal("careerStage" in parseOpportunityQuery(new URLSearchParams("")), false);
  assert.ok(careerStageFilterSlugs("phd").includes("phd-student"));
  assert.ok(careerStageFilterSlugs("faculty").includes("professor"));
});

test("digest escapes listing text before it reaches email HTML", () => {
  assert.equal(escapeHtml(`<a href="x">Lab & 'Co'</a>`), "&lt;a href=&quot;x&quot;&gt;Lab &amp; &#39;Co&#39;&lt;/a&gt;");
});

test("saved deadlines are reminded across the weekly digest gap but not after closing", () => {
  const now = new Date("2026-10-14T09:00:00Z");
  const inDays = (days: number) => new Date(now.getTime() + days * 86_400_000);
  assert.equal(isDeadlineDue(inDays(6), 7, now), true);
  assert.equal(isDeadlineDue(inDays(7), 3, now), true, "a 3-day lead still needs the weekly window");
  assert.equal(isDeadlineDue(inDays(12), 7, now), false);
  assert.equal(isDeadlineDue(inDays(12), 14, now), true);
  assert.equal(isDeadlineDue(inDays(-1), 7, now), false);
  assert.equal(isDeadlineDue(inDays(45), 90, now), false, "lookahead is capped at 30 days");
});

test("country list is complete, unique and maps names", () => {
  const codes = countries.map(([code]) => code);
  assert.equal(new Set(codes).size, codes.length);
  assert.ok(codes.length >= 249);
  assert.ok(codes.every((code) => /^[A-Z]{2}$/.test(code)));
  assert.equal(countryName("ir"), "Iran");
  assert.equal(isCountryCode("de"), true);
  assert.equal(isCountryCode("ZZ"), false);
});

test("robots keeps people out of search engines but lets public directories in", () => {
  const rules = robots().rules;
  const disallow = (Array.isArray(rules) ? rules[0] : rules).disallow as string[];
  for (const path of ["/discover", "/profile", "/researchers", "/opportunities/saved", "/settings"]) assert.ok(disallow.includes(path), path);
  for (const path of ["/scanner", "/conferences", "/opportunities", "/terms", "/privacy"]) assert.ok(!disallow.includes(path), path);
});

test("sitemap lists public pages on the configured host, not the build placeholder", () => {
  const previous = process.env.BETTER_AUTH_URL;
  process.env.BETTER_AUTH_URL = "https://provenant.example/";
  try {
    const urls = sitemap().map((entry) => entry.url);
    assert.ok(urls.includes("https://provenant.example/"));
    assert.ok(urls.includes("https://provenant.example/scanner"));
    assert.ok(urls.every((url) => url.startsWith("https://provenant.example/")));
  } finally {
    if (previous === undefined) delete process.env.BETTER_AUTH_URL;
    else process.env.BETTER_AUTH_URL = previous;
  }
  for (const file of ["robots.ts", "sitemap.ts"]) {
    assert.match(readFileSync(new URL(`../src/app/${file}`, import.meta.url), "utf8"), /export const dynamic = "force-dynamic"/);
  }
});

test("directories use https links, no duplicates, and no computer-science-only venues", () => {
  const all = [...scannerCategories.flatMap((category) => category.sources), ...conferenceCategories.flatMap((category) => category.sources)];
  assert.ok(all.every((source) => source.href.startsWith("https://")), "https only");
  const names = scannerCategories.flatMap((category) => category.sources.map((source) => source.name));
  assert.equal(new Set(names).size, names.length, "no source listed twice in Scanner");
  const venues = conferenceCategories.flatMap((category) => category.sources.map((source) => source.name));
  for (const name of ["CORE Rankings Portal", "DBLP", "WikiCFP"]) assert.ok(!venues.includes(name), name);
});

test("sign-up requires terms consent and auth forms never submit credentials by GET", () => {
  const authForm = readFileSync(new URL("../src/app/auth/auth-form.tsx", import.meta.url), "utf8");
  const passwordForm = readFileSync(new URL("../src/app/auth/password-form.tsx", import.meta.url), "utf8");
  assert.match(authForm, /<form className=\{styles\.form\} method="post"/);
  assert.match(passwordForm, /<form className=\{styles\.form\} method="post"/);
  assert.match(authForm, /name="termsAccepted" type="checkbox" required/);
  assert.match(authForm, /href="\/terms"/);
  assert.match(authForm, /href="\/privacy"/);
});
