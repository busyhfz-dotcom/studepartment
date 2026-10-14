import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { researchTopics, researchMethods } from "@studepartment/db/taxonomy";
import { retryAfterSeconds } from "../src/lib/retry-after";
import { effectiveMonthlyPrice, lowestMonthlyPlan, proPlans } from "../src/lib/plans";
import { parseProfileUpdateInput } from "../src/server/validation/profile";
import { loadPublicOpportunityTicker } from "../src/server/opportunities/public-ticker";

test("an empty ticker retains real zero counts and never supplies demo opportunities", async () => {
  const db = { opportunity: { findMany: async () => [], count: async () => 0 } } as unknown as Parameters<typeof loadPublicOpportunityTicker>[0];
  const ticker = await loadPublicOpportunityTicker(db);
  assert.equal(ticker.available, true);
  assert.deepEqual(ticker.positions, []);
  assert.deepEqual(ticker.grants, []);
  assert.deepEqual(ticker.stats, { totalPositions: 0, totalGrants: 0, countries: 0 });
});

test("a real position does not fabricate a grant feed or overwrite zero totals", async () => {
  const row = { id: "test-position", title: "Synthetic nursing research position", countryCode: "IR", deadline: null, deadlinePrecision: "ROLLING", organization: { name: "Synthetic Medical Unit" } };
  const db = { opportunity: {
    findMany: async ({ where }: { where: { status: string; type?: unknown; countryCode?: unknown } }) => {
      assert.equal(where.status, "ACTIVE");
      if (where.countryCode) return [{ countryCode: "IR" }];
      return where.type === "GRANT" ? [] : [row];
    },
    count: async ({ where }: { where: { type: unknown } }) => where.type === "GRANT" ? 0 : 1,
  } } as unknown as Parameters<typeof loadPublicOpportunityTicker>[0];
  const ticker = await loadPublicOpportunityTicker(db);
  assert.equal(ticker.positions[0].id, row.id);
  assert.deepEqual(ticker.grants, []);
  assert.deepEqual(ticker.stats, { totalPositions: 1, totalGrants: 0, countries: 1 });
});

test("Retry-After accepts seconds, dates, vendor header and invalid values", () => {
  const now = Date.parse("2026-10-14T10:00:00Z");
  assert.equal(retryAfterSeconds(new Headers({ "retry-after": "292" }), now), 292);
  assert.equal(retryAfterSeconds(new Headers({ "x-retry-after": "42" }), now), 42);
  assert.equal(retryAfterSeconds(new Headers({ "retry-after": "Wed, 14 Oct 2026 10:01:30 GMT" }), now), 90);
  assert.equal(retryAfterSeconds(new Headers({ "retry-after": "Wed, 14 Oct 2026 09:00:00 GMT" }), now), 0);
  assert.equal(retryAfterSeconds(new Headers({ "retry-after": "invalid" }), now), 60);
  assert.equal(retryAfterSeconds(new Headers(), now), 60);
  assert.equal(retryAfterSeconds(new Headers({ "retry-after": "0", "x-retry-after": "42" }), now), 0);
});

test("medical catalog is unique, provisioned by migrations and includes the audited specializations", () => {
  const directory = new URL("../../../packages/db/prisma/migrations/", import.meta.url);
  const sql = readdirSync(directory, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => readFileSync(new URL(entry.name + "/migration.sql", directory), "utf8")).join("\n");
  for (const list of [researchTopics, researchMethods]) {
    assert.equal(new Set(list.map(([slug]) => slug)).size, list.length);
    for (const [slug] of list) assert.ok(sql.includes(`'${slug}'`), `${slug} needs a migration, not only demo seed`);
  }
  for (const slug of ["rare-diseases", "epidemiology", "nursing", "medical-imaging", "mental-health"]) assert.ok(researchTopics.some(([value]) => value === slug));
});

test("unlisted affiliation is saved as a self-reported profile field without a verified organization", () => {
  const result = parseProfileUpdateInput({ organizationId: null, profileDetails: { unlistedInstitution: "Synthetic Tehran Medical Research Unit" } });
  assert.equal(result.organizationId, null);
  assert.equal(result.profileDetails?.unlistedInstitution, "Synthetic Tehran Medical Research Unit");
  assert.throws(() => parseProfileUpdateInput({ profileDetails: { unlistedInstitution: "x".repeat(241) } }));
  assert.throws(() => parseProfileUpdateInput({ profileDetails: { verifiedInstitution: true } }));
});

test("planned billing compares effective cost without changing business prices", () => {
  assert.deepEqual(proPlans.map(effectiveMonthlyPrice), ["$8.00", "$5.00", "$7.50", "$7.50"]);
  assert.equal(lowestMonthlyPlan.id, "quarterly");
  assert.deepEqual(proPlans.map((plan) => plan.amountCents), [800, 1500, 4500, 9000]);
});
