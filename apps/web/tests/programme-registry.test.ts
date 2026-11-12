import assert from "node:assert/strict";
import test from "node:test";
import { PROGRAMMES } from "../src/server/opportunities/sources/programme-registry-data";
import {
  PROGRAMME_SOURCE_NAME,
  programmePagePublished,
  programmeRegistrySource,
  robotsAllows,
  toProgrammeRecords,
} from "../src/server/opportunities/sources/programme-registry";
import { INSTITUTION_FEEDS } from "../src/server/opportunities/sources/institution-feeds";
import { mdPhdAudienceWhere } from "../src/server/opportunities/audience";

const page = (status: number, body: string) => new Response(body, { status });

test("every registry entry has a permanent unique id and an https page on the provider's site", () => {
  assert.equal(new Set(PROGRAMMES.map((programme) => programme.id)).size, PROGRAMMES.length);
  for (const programme of PROGRAMMES) {
    assert.match(programme.id, /^[a-z0-9-]+$/, programme.id);
    assert.equal(new URL(programme.url).protocol, "https:", programme.id);
    assert.ok(programme.match.trim().length >= 2 && programme.levels.length > 0 && programme.summary.length > 40, programme.id);
    // Aggregators are linked from Scanner; only the provider's own page may back a listing.
    assert.doesNotMatch(programme.url, /scholarshipportal|findaphd|findamasters|scholars4dev|opportunitiesforafricans|scholarshipdb/i);
  }
});

test("dual-degree programmes are findable by the MD-PhD view and typed so it accepts them", () => {
  const dual = PROGRAMMES.filter((programme) => programme.id.startsWith("mdphd-"));
  assert.ok(dual.length >= 20);
  for (const programme of dual) assert.ok(programme.levels.every((level) => level === "PHD_SCHOLARSHIP" || level === "FELLOWSHIP"), programme.id);
  const where = JSON.stringify(mdPhdAudienceWhere());
  assert.ok(where.includes(JSON.stringify({ sourceName: PROGRAMME_SOURCE_NAME, sourceRecordId: { startsWith: "mdphd-" } })));
  assert.equal(programmeRegistrySource.source.name, PROGRAMME_SOURCE_NAME);
});

test("one record per funded level, with no invented deadline", () => {
  const both = PROGRAMMES.find((programme) => programme.id === "gates-cambridge")!;
  const records = toProgrammeRecords(both);
  assert.deepEqual(records.map((record) => record.type).sort(), ["MASTERS_SCHOLARSHIP", "PHD_SCHOLARSHIP"]);
  assert.deepEqual(records.map((record) => record.sourceRecordId).sort(), ["gates-cambridge:MASTERS_SCHOLARSHIP", "gates-cambridge:PHD_SCHOLARSHIP"]);
  for (const record of records) {
    assert.equal(record.deadline, null);
    assert.equal(record.sourceUrl, both.url);
    assert.match(record.description ?? "", /confirm them there before you apply/);
  }
});

test("robots.txt rules are honoured", () => {
  const robots = "User-agent: *\nDisallow: /private/\nAllow: /private/open\nDisallow: /*.pdf$\n\nUser-agent: BadBot\nDisallow: /";
  assert.equal(robotsAllows(robots, "/scholarships/"), true);
  assert.equal(robotsAllows(robots, "/private/page"), false);
  assert.equal(robotsAllows(robots, "/private/open/page"), true);
  assert.equal(robotsAllows(robots, "/files/guide.pdf"), false);
  assert.equal(robotsAllows("User-agent: *\nDisallow: /", "/anything"), false);
  assert.equal(robotsAllows("User-agent: *\nDisallow:", "/anything"), true);
  assert.equal(robotsAllows("User-agent: *\nAllow: /\n\nUser-agent: ProvenantBot\nDisallow: /", "/anything"), false);
});

test("a programme is listed only when its page is allowed, online and still names it", async () => {
  const programme = PROGRAMMES.find((entry) => entry.id === "chevening")!;
  const site = (robots: Response, body: Response) => async (url: string) => (url.endsWith("/robots.txt") ? robots : body);
  const check = (robots: Response, body: Response) => programmePagePublished(site(robots, body), programme, new Map());
  assert.equal(await check(page(404, ""), page(200, "<h1>Chevening Scholarships</h1>")), true);
  assert.equal(await check(page(200, "User-agent: *\nDisallow: /scholarships"), page(200, "Chevening")), false);
  assert.equal(await check(page(404, ""), page(404, "Chevening")), false);
  assert.equal(await check(page(404, ""), page(403, "Chevening")), false);
  assert.equal(await check(page(404, ""), page(200, "<h1>Page not found</h1>")), false);
  const offline = async () => { throw new Error("network"); };
  assert.equal(await programmePagePublished(offline, programme, new Map()), false);
});

test("a run with almost no reachable pages fails instead of taking every programme down", async () => {
  const offline = async () => { throw new Error("network"); };
  await assert.rejects(programmeRegistrySource.collect({ fetch: offline, now: new Date(), env: process.env, log: () => undefined }), /Too few programme pages/);
});

test("university vacancy feeds are official https feeds with unique ids", () => {
  assert.equal(new Set(INSTITUTION_FEEDS.map((feed) => feed.id)).size, INSTITUTION_FEEDS.length);
  for (const feed of INSTITUTION_FEEDS) assert.equal(new URL(feed.feedUrl).protocol, "https:", feed.id);
  for (const id of ["cambridge", "leeds", "karolinska", "lund", "uppsala"]) assert.ok(INSTITUTION_FEEDS.some((feed) => feed.id === id), id);
});
