import assert from "node:assert/strict";
import test from "node:test";
import { parseFeed } from "../src/server/opportunities/sources/rss";
import {
  classifyPositionTitle,
  countryCodeFromText,
  isMedicalText,
  topicSlugsFor,
} from "../src/server/opportunities/sources/classify";
import { activityCode, detailNeedsRefresh, grantsGovDate, grantsGovType, grantsGovSource, toGrantsGovRecord } from "../src/server/opportunities/sources/grants-gov";
import { isHealthTopic, nextDeadline, toEuRecord } from "../src/server/opportunities/sources/eu-funding-tenders";
import { maxPlanckInstitute, toMaxPlanckRecord } from "../src/server/opportunities/sources/max-planck";
import { parseNhsJobs, toNhsRecord } from "../src/server/opportunities/sources/nhs-jobs";
import { INSTITUTION_FEEDS, stripReference, toInstitutionFeedRecord } from "../src/server/opportunities/sources/institution-feeds";
import { toGreenhouseRecord } from "../src/server/opportunities/sources/greenhouse";
import { deadlineFromText } from "../src/server/opportunities/sources/positions";
import { htmlToText } from "../src/server/opportunities/sources/text";
import { opportunitySyncEnabled } from "../src/server/opportunities/sources/scheduler";
import { opportunitySources } from "../src/server/opportunities/sources/registry";
import { isSourceDue, type SourceRunResult } from "../src/server/opportunities/sources/sync";
import { searchTerms } from "../src/server/opportunities/search-terms";

const now = new Date("2026-10-15T12:00:00Z");

test("feed parser reads RSS items with CDATA, entities and categories, and Atom entries", () => {
  const rss = `<?xml version="1.0"?><rss><channel><title>Jobs</title>
    <item><title><![CDATA[Postdoc (m/f/d) | Tumour Immunology]]></title><link>https://www.mpg.de/1/postdoc</link>
    <guid>https://www.mpg.de/1/postdoc</guid><pubDate>Wed, 14 Oct 2026 15:50:00 +0200</pubDate>
    <description>The Max Planck Institute for Molecular Biomedicine &amp; partners seek…</description>
    <category>Biology &amp; Medicine</category><category>International</category></item></channel></rss>`;
  const [item] = parseFeed(rss);
  assert.equal(item.title, "Postdoc (m/f/d) | Tumour Immunology");
  assert.equal(item.link, "https://www.mpg.de/1/postdoc");
  assert.equal(item.publishedAt, "2026-10-14T13:50:00.000Z");
  assert.deepEqual(item.categories, ["Biology & Medicine", "International"]);
  assert.match(item.description, /Biomedicine & partners/);

  const atom = `<feed><entry><title>PhD position in cardiology</title><link rel="alternate" href="https://example.org/j/1"/>
    <id>urn:1</id><updated>2026-10-01T00:00:00Z</updated><summary>Heart research</summary></entry></feed>`;
  const [entry] = parseFeed(atom);
  assert.equal(entry.link, "https://example.org/j/1");
  assert.equal(entry.guid, "urn:1");
});

test("only research positions are classified, by title", () => {
  assert.equal(classifyPositionTitle("Postdoctoral Research Associate – Sensory Neurobiology"), "POSTDOC");
  assert.equal(classifyPositionTitle("Research Fellow in Cancer Genomics"), "POSTDOC");
  assert.equal(classifyPositionTitle("Research Fellow positions (Doctoral Researchers) (f/m/d)"), "PHD");
  assert.equal(classifyPositionTitle("PhD position (m/f/d) in Immunology"), "PHD");
  assert.equal(classifyPositionTitle("4-year PhD Studentship in Cardiovascular Medicine"), "PHD");
  assert.equal(classifyPositionTitle("Clinical Research Fellowship in Oncology"), "FELLOWSHIP");
  assert.equal(classifyPositionTitle("Clinical Research Fellow (Cardiology)"), "FELLOWSHIP");
  assert.equal(classifyPositionTitle("Senior Scientist, Mass Spectrometry"), null);
  assert.equal(classifyPositionTitle("Research Nurse"), null);
  assert.equal(classifyPositionTitle("Wellcome Early-Career Fellowship"), "FELLOWSHIP");
  assert.equal(classifyPositionTitle("Research Assistant, Infectious Disease Lab"), "RESEARCH_ASSISTANTSHIP");
  assert.equal(classifyPositionTitle("Professor of Medicine"), null);
  assert.equal(classifyPositionTitle("HR Manager"), null);
  assert.equal(classifyPositionTitle("Chief of Staff"), null);
});

test("medical relevance ignores benefits boilerplate and tags topics", () => {
  assert.equal(isMedicalText("Postdoc in tumour immunology"), true);
  assert.equal(isMedicalText("Postdoc in seismology", "Benefits include health insurance"), false);
  assert.equal(isMedicalText("PhD in particle physics"), false);
  assert.equal(isMedicalText("Max Planck Research Group Constellations of Global (Dis)Ordering (DISORDER)"), false);
  assert.equal(isMedicalText("Living labs to enhance soil health"), false);
  assert.equal(isMedicalText("Strengthening plant health: emerging pest risks"), false);
  assert.deepEqual(topicSlugsFor("CAR-T immunotherapy for leukemia").slice(0, 3), ["oncology", "cancer-immunotherapy", "immunology"]);
});

test("country and employer are read from free text conservatively", () => {
  assert.equal(countryCodeFromText("Princeton, New Jersey"), "US");
  assert.equal(countryCodeFromText("Oslo, Norway"), "NO");
  assert.equal(countryCodeFromText("Baltimore, MD"), "US");
  assert.equal(countryCodeFromText("Remote"), null);
});

test("Grants.gov notices map to dated, typed records with the full announcement link", () => {
  assert.equal(grantsGovDate("11/17/2026"), "2026-11-17");
  assert.equal(grantsGovDate(""), null);
  assert.equal(activityCode("Ruth L. Kirschstein NRSA Individual Predoctoral Fellowship (Parent F31)"), "F31");
  assert.deepEqual(grantsGovType("Individual Predoctoral Fellowship (Parent F31)"), { type: "FELLOWSHIP", eligibleCareerStages: ["phd"] });
  assert.deepEqual(grantsGovType("Pathway to Independence Award (Parent K99/R00)"), { type: "GRANT", eligibleCareerStages: ["postdoc"] });
  const record = toGrantsGovRecord(
    { id: "357305", number: "PAR-25-274", title: "Feasibility Clinical Trials of Mind &amp; Body Interventions (R34)", agencyCode: "HHS-NIH11", agency: "National Institutes of Health", openDate: "11/21/2024", closeDate: "11/17/2026", oppStatus: "posted" },
    { synopsisDesc: "<p>Supports feasibility trials of cancer pain interventions.</p>", applicantTypes: [{ description: "Private institutions of higher education" }], fundingDescLinkUrl: "http://grants.nih.gov/grants/guide/pa-files/PAR-25-274.html", awardCeiling: "none" },
  );
  assert.equal(record.title, "Feasibility Clinical Trials of Mind & Body Interventions (R34)");
  assert.equal(record.sourceUrl, "https://www.grants.gov/search-results-detail/357305");
  assert.equal(record.applicationUrl, "https://grants.nih.gov/grants/guide/pa-files/PAR-25-274.html");
  assert.equal(record.deadline, "2026-11-17");
  assert.equal(record.countryCode, "US");
  assert.match(record.description ?? "", /Eligible applicants: Private institutions of higher education\./);
  assert.ok(record.topicSlugs?.includes("clinical-trials"));
});

test("EU topics: health filter, next open deadline, forthcoming notice and fellowship typing", () => {
  assert.equal(nextDeadline(["2026-10-01T00:00:00.000+0000", "2027-02-17T00:00:00.000+0000"], now), "2027-02-17");
  assert.equal(nextDeadline(["2026-10-15T00:00:00.000+0000"], now), "2026-10-15", "a deadline stays open on its own day");
  assert.equal(nextDeadline(["2026-09-01T00:00:00.000+0000"], now), null);
  const health = {
    identifier: ["HORIZON-HLTH-2027-01-IND-01"], title: ["Cell-free protein synthesis platforms"], status: ["31094501"],
    deadlineDate: ["2027-02-17T00:00:00.000+0000"], startDate: ["2026-10-29T00:00:00.000+0000"], callTitle: ["Cluster 1 - Health"],
    keywords: ["HORIZON-HLTH-2027-01", "Basic medicine"], descriptionByte: ["<p>Expected Outcome: biologicals.</p>"], typesOfAction: ["HORIZON  Research and Innovation Actions"],
  };
  assert.equal(isHealthTopic(health), true);
  assert.equal(isHealthTopic({ identifier: ["HORIZON-CL5-2027-D3-01"], title: ["Offshore wind turbines"], keywords: ["Energy"] }), false);
  assert.equal(isHealthTopic({ identifier: ["HORIZON-CL6-2027-01"], title: ["Nutrition and diabetes prevention"], keywords: [] }), true);
  assert.equal(isHealthTopic({ identifier: ["HORIZON-NATURE-2027-02-02"], title: ["Living labs for ecosystem restoration"], keywords: ["Pathogens"] }), false);
  const record = toEuRecord({ metadata: health }, now);
  assert.ok(record);
  assert.equal(record.type, "GRANT");
  assert.equal(record.deadline, "2027-02-17");
  assert.equal(record.sourceUrl, "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/HORIZON-HLTH-2027-01-IND-01");
  assert.match(record.description ?? "", /^Opens for submissions on 2026-10-29\./);
  assert.match(record.description ?? "", /Type of action: HORIZON Research and Innovation Actions\./);
  const pf = toEuRecord({ metadata: { ...health, identifier: ["HORIZON-MSCA-2026-PF-01-01"], title: ["MSCA Postdoctoral Fellowships 2026"], status: ["31094502"] } }, now);
  assert.equal(pf?.type, "FELLOWSHIP");
  assert.deepEqual(pf?.eligibleCareerStages, ["postdoc"]);
  assert.equal(pf?.organization.name, "Marie Skłodowska-Curie Actions");
  assert.equal(toEuRecord({ metadata: { ...health, deadlineDate: ["2026-01-01T00:00:00.000+0000"] } }, now), null, "closed topics are dropped");
});

test("Max Planck, NHS, university feeds and Greenhouse keep only biomedical research positions", () => {
  assert.equal(maxPlanckInstitute("The Max Planck Institute for Molecular Biomedicine is recruiting"), "Max Planck Institute for Molecular Biomedicine");
  const medical = toMaxPlanckRecord({
    title: "Postdoc (m/f/d) | Tumour immunology", link: "https://www.mpg.de/2/postdoc", guid: "https://www.mpg.de/2/postdoc", publishedAt: "2026-10-14T00:00:00.000Z",
    description: "The Max Planck Institute for Molecular Biomedicine in Münster seeks a postdoc in cancer immunology. Application deadline: 30 November 2026.", content: "", categories: ["Biology & Medicine"], creator: "",
  }, now);
  assert.equal(medical?.type, "POSTDOC");
  assert.equal(medical?.organization.name, "Max Planck Institute for Molecular Biomedicine");
  assert.equal(medical?.countryCode, "DE");
  assert.equal(medical?.deadline, "2026-11-30");
  const social = toMaxPlanckRecord({
    title: "Postdoc / Research Scientist | Kinship Inequalities", link: "https://www.mpg.de/3", guid: "3", publishedAt: null,
    description: "The Max Planck Institute for Demographic Research is recruiting a postdoc in demography.", content: "", categories: ["Social Sciences"], creator: "",
  }, now);
  assert.equal(social, null);

  const xml = `<?xml version='1.0' encoding='UTF-8'?><nhsJobs><vacancyDetails><id>5650932</id><reference>C9387</reference><title>Clinical Research Fellow</title><description>Psychological research &amp; audit…</description><employer>Bristol NHS Foundation Trust </employer><type>Permanent</type><closeDate>2026-10-22</closeDate><postDate>2026-10-08T11:20:56.741899461</postDate><url>https://beta.jobs.nhs.uk/candidate/jobadvert/C9387-26-2079</url><locations><location>Bristol, BS2 8BJ</location></locations></vacancyDetails><vacancyDetails><id>2</id><title>Research Delivery Manager</title><employer>X</employer><url>https://beta.jobs.nhs.uk/candidate/jobadvert/2</url><locations><location>Leeds</location></locations></vacancyDetails><totalPages>3</totalPages><totalResults>21</totalResults></nhsJobs>`;
  const parsed = parseNhsJobs(xml);
  assert.equal(parsed.totalPages, 3);
  const nhs = toNhsRecord(parsed.vacancies[0]);
  assert.equal(nhs?.type, "FELLOWSHIP");
  assert.equal(nhs?.organization.name, "Bristol NHS Foundation Trust");
  assert.equal(nhs?.city, "Bristol");
  assert.equal(nhs?.deadline, "2026-10-22");
  assert.equal(nhs?.publishedAt, "2026-10-08T11:20:56Z");
  assert.equal(nhs?.description, "Psychological research & audit…");
  assert.equal(toNhsRecord(parsed.vacancies[1]), null, "management posts are not listed");
  assert.equal(toNhsRecord({ ...parsed.vacancies[0], title: "Hand and Wrist Fellowship - Senior Clinical Fellow" }), null, "clinical training fellowships are not research posts");
  assert.equal(toNhsRecord({ ...parsed.vacancies[0], title: "Consultant Psychiatrist and Honorary Research Fellow" }), null);

  assert.equal(stripReference("Research Associate/Fellow (Fixed Term) (MED2602326)"), "Research Associate/Fellow (Fixed Term)");
  assert.equal(stripReference("PhD Studentship: Net Zero (ENG416)"), "PhD Studentship: Net Zero");
  const nottingham = INSTITUTION_FEEDS[0];
  const medSchool = toInstitutionFeedRecord({ title: "Research Fellow (Fixed Term) (MED505626)", link: "https://jobs.nottingham.ac.uk/rss/click.aspx?ref=MED505626", guid: "MED505626", publishedAt: null, description: "<p>Join our team.</p>", content: "", categories: [], creator: "" }, nottingham, now);
  assert.equal(medSchool?.type, "POSTDOC");
  assert.equal(medSchool?.title, "Research Fellow (Fixed Term)");
  assert.equal(medSchool?.city, "Nottingham");
  assert.equal(toInstitutionFeedRecord({ title: "Research Associate/Fellow in Optimisation for 3D Printing (ENG0484726)", link: "https://jobs.nottingham.ac.uk/x", guid: "ENG0484726", publishedAt: null, description: "Additive manufacturing of metal parts.", content: "", categories: [], creator: "" }, nottingham, now), null);

  const board = { token: "arcinstitute", name: "Arc Institute", website: "https://arcinstitute.org", countryCode: "US" };
  assert.equal(toGreenhouseRecord({ id: 1, title: "Chief of Staff", absolute_url: "https://job-boards.greenhouse.io/arcinstitute/jobs/1" }, board), null);
  const postdoc = toGreenhouseRecord({ id: 2, title: "Postdoctoral Fellow, Alzheimer's Disease", absolute_url: "https://job-boards.greenhouse.io/arcinstitute/jobs/2", location: { name: "Palo Alto, CA" }, content: "&lt;p&gt;Study &amp;amp; model neurodegeneration.&lt;/p&gt;" }, board);
  assert.equal(postdoc?.type, "POSTDOC");
  assert.equal(postdoc?.city, "Palo Alto");
  assert.equal(postdoc?.description, "Study & model neurodegeneration.");
});

test("deadlines in free text are read only when plausible", () => {
  assert.equal(deadlineFromText("Application deadline: 30 November 2026", now), "2026-11-30");
  assert.equal(deadlineFromText("Closing date: December 5, 2026", now), "2026-12-05");
  assert.equal(deadlineFromText("Deadline 01.12.2026", now), "2026-12-01");
  assert.equal(deadlineFromText("Start date: January 2028", now), null);
  assert.equal(deadlineFromText("Deadline: 1 January 2020", now), null);
  assert.equal(htmlToText("<p>A&nbsp;&amp;&nbsp;B</p><script>x()</script>"), "A & B");
});

test("sources have stable unique ids and names, and the scheduler stays off outside production", () => {
  const ids = opportunitySources.map((source) => source.id);
  const names = opportunitySources.map((source) => source.source.name);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(names).size, names.length);
  assert.ok(opportunitySources.every((source) => source.homepage.startsWith("https://")));
  assert.equal(opportunitySyncEnabled({ NODE_ENV: "production", DATABASE_URL: "postgres://x" }), true);
  assert.equal(opportunitySyncEnabled({ NODE_ENV: "production", DEPLOYMENT_ENV: "ci", DATABASE_URL: "postgres://x" }), false);
  assert.equal(opportunitySyncEnabled({ NODE_ENV: "development", OPPORTUNITY_SYNC: "on" }), true);
  assert.equal(opportunitySyncEnabled({ NODE_ENV: "production", DATABASE_URL: "postgres://x", OPPORTUNITY_SYNC: "off" }), false);
  assert.equal(opportunitySources.find((source) => source.id === "usajobs")?.isEnabled({} as NodeJS.ProcessEnv), false, "USAJOBS needs a key");
});

test("search terms drop filler words and fold simple plurals", () => {
  assert.deepEqual(searchTerms("Postdoc positions in cancer grants"), ["postdoc", "cancer", "grant"]);
  assert.deepEqual(searchTerms("an RNA job"), ["rna"]);
});

test("sources are checked around the clock: hourly when healthy, sooner after a failure", async () => {
  const hourly = { ...grantsGovSource, intervalMinutes: 60 };
  const run = (minutesAgo: number, status: SourceRunResult["status"]): SourceRunResult => ({
    id: hourly.id, name: hourly.source.name, status, durationMs: 1, startedAt: new Date(now.getTime() - minutesAgo * 60_000).toISOString(),
  });
  assert.equal(await isSourceDue(hourly, now, run(20, "ok"), null), false);
  assert.equal(await isSourceDue(hourly, now, run(59, "ok"), null), true, "a tick a minute early still counts");
  assert.equal(await isSourceDue(hourly, now, run(20, "failed"), null), false);
  assert.equal(await isSourceDue(hourly, now, run(30, "failed"), null), true, "failures retry after 30 minutes");
  assert.equal(await isSourceDue(hourly, now, undefined, null), true, "never checked");
  assert.equal(await isSourceDue(hourly, now, undefined, new Date(now.getTime() - 15 * 60_000)), false, "a restart does not re-read a fresh source");
  assert.ok(opportunitySources.every((source) => source.intervalMinutes <= 180), "no source waits more than three hours");
});

test("Grants.gov notice texts are re-read only when new, changed or a day old", () => {
  const fresh = { synopsis: { synopsisDesc: "x" }, closeDate: "11/17/2026", fetchedAt: now.getTime() - 3_600_000 };
  assert.equal(detailNeedsRefresh(fresh, { closeDate: "11/17/2026" }, now), false);
  assert.equal(detailNeedsRefresh(fresh, { closeDate: "12/01/2026" }, now), true, "deadline changed");
  assert.equal(detailNeedsRefresh({ ...fresh, fetchedAt: now.getTime() - 25 * 3_600_000 }, { closeDate: "11/17/2026" }, now), true);
  assert.equal(detailNeedsRefresh({ ...fresh, synopsis: undefined }, { closeDate: "11/17/2026" }, now), true);
});
