"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type {
  ApiError,
  ApiSuccess,
  OpportunityIntelligenceResponse,
  OpportunityTypeValue,
} from "@/lib/api-contracts";
import type { OpportunityCareerStage } from "@/lib/api-contracts";
import { readOpportunityPage, readOpportunitySort } from "@/lib/opportunity-pagination";
import { FeedbackControls } from "@/components/feedback/feedback-controls";
import { researchTopics } from "@studepartment/db/taxonomy";
import styles from "./page.module.css";
import { SaveOpportunityButton } from "./save-opportunity-button";
import { CountrySelect } from "@/components/forms/country-select";
import { OpportunityPager } from "@/components/forms/opportunity-pager";
import { ShareOpportunity } from '@/components/opportunities/share-opportunity';
import { DeadlineReminder } from '@/components/opportunities/deadline-reminder';
import { GrantTable } from '@/components/opportunities/grant-table';

type OpportunityApiResponse = ApiSuccess<OpportunityIntelligenceResponse> | ApiError;

const typeOptions: Array<{ value: "" | OpportunityTypeValue; label: string }> = [
  { value: "", label: "All opportunity types" },
  { value: "postdoc", label: "Postdoctoral positions" },
  { value: "phd", label: "PhD positions" },
  { value: "fellowship", label: "Fellowships" },
  { value: "grant", label: "Grants" },
  { value: "masters-scholarship", label: "Master’s scholarships" },
  { value: "phd-scholarship", label: "PhD scholarships" },
  { value: "collaboration", label: "Collaborations" },
  { value: "research-assistantship", label: "Research assistantships" },
];

const careerStageOptions: Array<{ value: "" | OpportunityCareerStage; label: string }> = [
  { value: "", label: "Any career stage" },
  { value: "student", label: "Student / research assistant" },
  { value: "phd", label: "PhD candidate (R1)" },
  { value: "postdoc", label: "Postdoc (R2)" },
  { value: "early-career-researcher", label: "Early-career independent (R3)" },
  { value: "faculty", label: "Faculty / professor (R3–R4)" },
];

const topicOptions = [{ value: "", label: "All research topics" }, ...researchTopics.map(([value, label]) => ({ value, label }))];

const filterKeys = ["q", "type", "topic", "country", "deadlineWithinDays", "career", "funder", "sourceRecordId", "eligibilityCountry", "audience"] as const;
type FilterKey = (typeof filterKeys)[number] | "sort";
type SearchFilters = Record<FilterKey, string>;

function readFilters(params: URLSearchParams): SearchFilters {
  return {
    q: params.get("q") ?? "",
    type: params.get("type") ?? "",
    topic: params.get("topic") ?? "",
    country: params.get("country") ?? "",
    deadlineWithinDays: params.get("deadlineWithinDays") ?? "",
    career: params.get("career") ?? "",
    funder: params.get("funder") ?? "",
    sourceRecordId: params.get("sourceRecordId") ?? "",
    eligibilityCountry: params.get("eligibilityCountry") ?? "",
    audience: params.get("audience") === "md-phd" ? "md-phd" : "",
    sort: readOpportunitySort(params.get("sort")),
  };
}

function formatDate(value?: string) {
  if (!value) return "Not published";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function typeLabel(value: OpportunityTypeValue) {
  return typeOptions.find((option) => option.value === value)?.label.replace(/s$/, "") ?? value;
}

export function OpportunityExplorer() {
  const searchKey = useSearchParams().toString();
  const appliedParams = new URLSearchParams(searchKey);
  const searchedWithFilters = filterKeys.some((key) => Boolean(appliedParams.get(key)));
  const hasSearch = searchedWithFilters || appliedParams.has("page");
  const [draft, setDraft] = useState<{ key: string; filters: SearchFilters }>();
  const filters = draft?.key === searchKey ? draft.filters : readFilters(appliedParams);
  const [attempt, setAttempt] = useState(0);
  const [response, setResponse] = useState<{ key: string; data?: OpportunityIntelligenceResponse; error?: string }>();
  const requestKey = searchKey + "#" + attempt;
  const loading = hasSearch && response?.key !== requestKey;
  const data = hasSearch && !loading ? response?.data : undefined;
  const error = hasSearch && !loading ? response?.error : undefined;

  useEffect(() => {
    if (!hasSearch) return;
    const controller = new AbortController();
    const fromUrl = new URLSearchParams(searchKey);
    const params = new URLSearchParams();
    for (const key of filterKeys) {
      const value = fromUrl.get(key);
      if (value) params.set(key, value);
    }
    params.set("sort", readOpportunitySort(fromUrl.get("sort")));
    params.set("page", String(readOpportunityPage(fromUrl.get("page"))));
    params.set("limit", "12");

    async function fetchPage() {
      try {
        const result = await fetch("/api/v1/opportunities?" + params, { signal: controller.signal });
        const body = (await result.json()) as OpportunityApiResponse;
        if (!result.ok || !body.success) {
          throw new Error(body.success ? "Opportunity intelligence request failed." : body.error.message);
        }
        if (!controller.signal.aborted) setResponse({ key: requestKey, data: body.data });
      } catch (error) {
        if (!controller.signal.aborted) setResponse({ key: requestKey, error: error instanceof Error ? error.message : "Opportunity intelligence request failed." });
      }
    }

    void fetchPage();
    return () => controller.abort();
  }, [hasSearch, requestKey, searchKey]);

  function changeFilter(key: FilterKey, value: string) {
    setDraft({ key: searchKey, filters: { ...filters, [key]: value } });
  }

  function runSearch(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(searchKey);
    for (const key of filterKeys) {
      const value = filters[key].trim();
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.set("sort", filters.sort);
    params.set("page", "1");
    if (params.toString() === searchKey) setAttempt((previous) => previous + 1);
    else window.history.pushState(null, "", "/opportunities?" + params);
  }

  function pageHref(page: number) {
    const params = new URLSearchParams(searchKey);
    params.set("page", String(page));
    return "/opportunities?" + params + "#opportunity-results";
  }

  return (
    <>
      <section className={styles.workbench}>
        <div className={styles.workbenchTopline}>
          <div>
            <span className="sectionLabel">Opportunity intent</span>
            <p>Filter the opportunity universe without collapsing scientific relevance and formal eligibility into one score.</p>
          </div>
          <div className={styles.systemBadge}>Source-aware intelligence</div>
        </div>

        <form className={styles.searchForm} action="/opportunities" method="get" onSubmit={runSearch}>
          <input type="hidden" name="page" value="1" />
          <div className={styles.intentRow}>
            <label className={styles.intentField}>
              <span className={styles.srOnly}>Opportunity search intent</span>
              <input
                name="q"
                maxLength={240}
                onChange={(event) => changeFilter("q", event.target.value)}
                placeholder="e.g. translational oncology postdoc in Europe"
                value={filters.q}
              />
            </label>
            <button className={styles.searchButton} disabled={loading} type="submit">
              {loading ? "Analyzing…" : "Find opportunities"}
            </button>
          </div>

          <div className={styles.filterGrid}>
            <label>
              <span>Research pathway</span>
              <select name="audience" value={filters.audience} onChange={(event) => changeFilter("audience", event.target.value)}>
                <option value="">All research pathways</option>
                <option value="md-phd">MD-PhD scholarships &amp; fellowships</option>
              </select>
            </label>
            <label>
              <span>Type</span>
              <select name="type" onChange={(event) => changeFilter("type", event.target.value)} value={filters.type}>
                {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span>Research topic</span>
              <select name="topic" onChange={(event) => changeFilter("topic", event.target.value)} value={filters.topic}>
                {topicOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span>Country</span>
              <CountrySelect name="country" ariaLabel="Country" onChange={(value) => changeFilter("country", value)} value={filters.country} />
            </label>
            <label>
              <span>Career stage</span>
              <select name="career" onChange={(event) => changeFilter("career", event.target.value)} value={filters.career}>
                {careerStageOptions.map((option) => <option key={option.value || "any-stage"} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span>Deadline</span>
              <select name="deadlineWithinDays" onChange={(event) => changeFilter("deadlineWithinDays", event.target.value)} value={filters.deadlineWithinDays}>
                <option value="">Any future deadline</option>
                <option value="30">Next 30 days</option>
                <option value="60">Next 60 days</option>
                <option value="90">Next 90 days</option>
                <option value="180">Next 6 months</option>
              </select>
            </label>
            <label>
              <span>Order results</span>
              <select name="sort" onChange={(event) => changeFilter("sort", event.target.value)} value={filters.sort}>
                <option value="newest">Newest published</option>
                <option value="deadline">Closing soon</option>
              </select>
            </label>
          </div>
          <details className={styles.advancedFilters} open={filters.funder || filters.sourceRecordId || filters.eligibilityCountry ? true : undefined}>
            <summary>More funding and eligibility filters</summary>
            <div className={styles.filterGrid}>
              <label>
                <span>Funder or institution</span>
                <input name="funder" value={filters.funder} maxLength={120} onChange={(event) => changeFilter("funder", event.target.value)} />
              </label>
              <label>
                <span>Source record ID</span>
                <input name="sourceRecordId" value={filters.sourceRecordId} maxLength={128} onChange={(event) => changeFilter("sourceRecordId", event.target.value)} />
              </label>
              <label>
                <span>Published eligible country</span>
                <CountrySelect name="eligibilityCountry" ariaLabel="Published eligible country" value={filters.eligibilityCountry} onChange={(value) => changeFilter("eligibilityCountry", value)} />
              </label>
            </div>
            <p>The eligible-country filter includes records that explicitly list that country. Location and eligibility are separate.</p>
          </details>
        </form>
      </section>

      {error ? <div className={styles.errorBanner} role="alert">{error} <button type="button" onClick={() => setAttempt((previous) => previous + 1)}>Retry search</button></div> : null}

      <section className={styles.resultsSection} id="opportunity-results" aria-busy={loading}>
        <aside className={styles.networkSources}>
          <strong>Explore recruitment networks</strong>
          <p>LinkedIn and ResearchGate open on their own websites. Their listings are not automatically imported here.</p>
          <a href="https://www.linkedin.com/jobs/" target="_blank" rel="noopener noreferrer">LinkedIn Jobs ↗</a>
          <a href="https://www.researchgate.net/jobs" target="_blank" rel="noopener noreferrer">ResearchGate Jobs ↗</a>
        </aside>
        <div className={styles.resultsHeader}>
          <div>
            <span className="sectionLabel">Decision queue</span>
            <h2>{data ? data.totalMatching.toLocaleString("en") + " matching opportunities" : "Run a source-aware search"}</h2>
          </div>
          {data ? (
            <div className={styles.contextBadge}>
              <span className={data.personalized ? styles.contextDotActive : styles.contextDot} />
              {data.personalized ? "Scientific Identity applied" : "General intelligence"}
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className={styles.loadingGrid}>
            <div className={styles.loadingCard} />
            <div className={styles.loadingCard} />
          </div>
        ) : null}

        {!loading && data?.results.length === 0 ? (
          <div className={styles.emptyState}>
            <strong>{searchedWithFilters ? "No current opportunities match this search." : "No current opportunities are listed."}</strong>
            <p>{searchedWithFilters ? "Try fewer filters, or browse original sources." : "The current feed is empty. You can browse official position and funding sources in Scanner."}</p>
            <a href="/scanner">Explore official sources in Scanner →</a>
          </div>
        ) : null}

        {!loading && !data && !error ? (
          <div className={styles.emptyState}>
            <strong>Opportunity Intelligence is ready.</strong>
            <p>Search to compare scientific relevance, published eligibility criteria, source freshness, and application timing.</p>
          </div>
        ) : null}

        {!loading && data?.results.length ? (
          data.query.types.length===1&&data.query.types[0]==='grant' ? <GrantTable items={data.results} params={appliedParams.toString()}/> : <div className={styles.resultList}>
            {data.results.map((opportunity) => (
              <article className={styles.card} key={opportunity.id}>
                <div className={styles.identity}>
                  <div className={styles.topline}>
                    <span className={styles.type}>{typeLabel(opportunity.type)}</span>
                    <span className={styles.freshness + " " + styles["freshness_" + opportunity.freshness]}>
                      {opportunity.freshness}
                    </span>
                  </div>
                  <h3 data-original-content><Link href={`/opportunities/${opportunity.id}`}>{opportunity.title}</Link></h3>
                  <strong data-original-content>{opportunity.organization}</strong>
                  <p data-original-content>{opportunity.location}</p>
                  <div className={styles.metaGrid}>
                    <div>
                      <span>Deadline</span>
                      <strong>{opportunity.deadlinePrecision === "rolling" ? "Rolling" : formatDate(opportunity.deadline)}</strong>
                    </div>
                    <div>
                      <span>Last verified</span>
                      <strong>{formatDate(opportunity.lastVerifiedAt)}</strong>
                    </div>
                  </div>
                  <div className={styles.tagRow}>
                    {opportunity.researchInterests.slice(0, 4).map((item) => <span key={item}>{item}</span>)}
                    {opportunity.methods.slice(0, 2).map((item) => <span key={item}>{item}</span>)}
                  </div>
                </div>

                {!data.personalized ? (
                  <div className={styles.analysisGrid}>
                    <section className={styles.analysisPanel} style={{ gridColumn: "1 / -1" }}>
                      <div className={styles.analysisHeading}>
                        <div>
                          <span className="sectionLabel">About this opportunity</span>
                        </div>
                      </div>
                      <p data-original-content style={{ margin: "0 0 12px", lineHeight: 1.6 }}>
                        {opportunity.description
                          ? (opportunity.description.replace(/\s+/g, " ").trim().slice(0, 420) + (opportunity.description.length > 420 ? "…" : ""))
                          : "The publisher did not provide a summary. Open the listing for the full details."}
                      </p>
                      <p style={{ margin: 0, fontSize: 13 }}>
                        <Link href={`/opportunities/${opportunity.id}`} style={{ textDecoration: "underline" }}>Read the full listing</Link>
                        {" · "}
                        <Link href="/auth/sign-up" style={{ textDecoration: "underline" }}>Add your research profile</Link> to see how well it fits and whether you are eligible.
                      </p>
                    </section>
                  </div>
                ) : (
                <div className={styles.analysisGrid}>
                  <section className={styles.analysisPanel}>
                    <div className={styles.analysisHeading}>
                      <div>
                        <span className="sectionLabel">Scientific relevance</span>
                        <strong>{opportunity.relevance}</strong>
                      </div>
                      <span className={styles.score}>{Math.round(opportunity.relevanceScore * 100)}%</span>
                    </div>
                    <ul>
                      {opportunity.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                    </ul>
                  </section>

                  <section className={styles.analysisPanel}>
                    <div className={styles.analysisHeading}>
                      <div>
                        <span className="sectionLabel">Published eligibility</span>
                        <strong>{opportunity.eligibility}</strong>
                      </div>
                      <span className={styles.eligibilityBadge + " " + styles["eligibility_" + opportunity.eligibility]}>
                        {opportunity.eligibility}
                      </span>
                    </div>
                    <ul>
                      {opportunity.eligibilityReasons.map((reason) => <li key={reason}>{reason}</li>)}
                      {opportunity.gaps.map((gap) => <li className={styles.gap} key={gap}>{gap}</li>)}
                    </ul>
                  </section>
                </div>
                )}

                <aside className={styles.sourceRail}>
                  <div className={styles.sourceBlock}>
                    <span>Original source</span>
                    <strong>{opportunity.source.name}</strong>
                    <small>{opportunity.source.type.replaceAll("-", " ")}</small>
                  </div>
                  <FeedbackControls entityId={opportunity.id} entityType="opportunity" />
                  <a className={styles.secondaryAction} href={opportunity.sourceUrl} rel="noreferrer" target="_blank">Review source</a>
                  <SaveOpportunityButton className={styles.secondaryAction} opportunityId={opportunity.id} />
                  <ShareOpportunity item={opportunity}/>
                  <DeadlineReminder items={[opportunity]}/>
                  <a className={styles.secondaryAction} href={"/assistant?opportunity=" + opportunity.id}>Ask assistant</a>
                  <a className={styles.primaryAction} href={opportunity.applicationUrl ?? opportunity.sourceUrl} rel="noreferrer" target="_blank">Open application</a>
                </aside>
              </article>
            ))}
          </div>
        ) : null}
        {data?.pagination ? <OpportunityPager pagination={data.pagination} pageHref={pageHref} /> : null}
      </section>
    </>
  );
}
