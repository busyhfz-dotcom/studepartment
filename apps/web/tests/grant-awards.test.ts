import assert from "node:assert/strict";
import test from "node:test";
import { grantDetails } from "../src/server/opportunities/grant-details";
import { euAwardsFromDetails } from "../src/server/opportunities/sources/eu-awards";
import { mrcFundingPage } from "../src/server/opportunities/sources/ukri-medical-research";

test("EU amount parsing keeps each topic's project range and ignores total programme budgets", () => {
  const rows = euAwardsFromDetails({
    TopicDetails: { budgetOverviewJSONItem: { budgetTopicActionMap: {
      "1": [{ action: "HORIZON-TEST-01 - HORIZON-RIA", minContribution: 1_000_000, maxContribution: 2_000_000 }],
      "2": [{ action: "HORIZON-TEST-02 - HORIZON-CSA", minContribution: 0, maxContribution: 0 }],
    } } },
  });
  assert.deepEqual(Object.keys(rows), ["HORIZON-TEST-01"]);
  assert.equal(rows["HORIZON-TEST-01"].awardMin, 1_000_000);
  assert.equal(rows["HORIZON-TEST-01"].awardMax, 2_000_000);
  assert.equal(rows["HORIZON-TEST-01"].awardBasis, "indicative");
});

test("published amounts are visible for existing listings before the next scheduled scan", () => {
  const eu = grantDetails({ sourceName: "EU Funding & Tenders Portal", organization: "Horizon Europe", eligibleCountryCodes: [],
    sourceRecordId: "HORIZON-HLTH-2027-03-TOOL-04", metadata: { status: "forthcoming" } });
  assert.equal(eu.awardMin, "10000000");
  assert.equal(eu.awardMax, "12000000");
  assert.equal(eu.currency, "EUR");
  const uk = grantDetails({ sourceName: "UKRI Medical Research Council", organization: "UKRI", eligibleCountryCodes: [],
    sourceUrl: "https://www.ukri.org/opportunity/ukri-translation-mrc-impact-acceleration-awards/", metadata: null });
  assert.equal(uk.awardMin, "50000");
  assert.equal(uk.awardMax, "300000");
});

test("UKRI list cards parse the published Award range field", () => {
  const html = 'Funding opportunity list <div id="post-123"><a class="ukri-funding-opp__link" href="https://www.ukri.org/opportunity/example/">Research grant</a>'
    + "<dt>Funders:</dt><dd>Medical Research Council</dd><dt>Opportunity status:</dt><dd>Open</dd>"
    + "<dt>Funding type:</dt><dd>Grant</dd><dt>Closing date:</dt><dd>22 February 2027</dd>"
    + "<dt>Award range:</dt><dd>&pound;50,000 – &pound;300,000</dd><!-- #post -->";
  const [result] = mrcFundingPage(html, new Date("2026-11-25")).records;
  assert.equal(result.metadata?.awardMin, "50000");
  assert.equal(result.metadata?.awardMax, "300000");
});
