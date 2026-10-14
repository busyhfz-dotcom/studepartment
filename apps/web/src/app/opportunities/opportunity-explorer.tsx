"use client";

import { FormEvent, useState } from "react";
import type {
  ApiError,
  ApiSuccess,
  OpportunityCareerStage,
  OpportunityIntelligenceResponse,
  OpportunityTypeValue,
} from "@/lib/api-contracts";
import { FeedbackControls } from "@/components/feedback/feedback-controls";
import { researchTopics } from "@studepartment/db/taxonomy";
import styles from "./page.module.css";
import { SaveOpportunityButton } from "./save-opportunity-button";
import { CountrySelect } from "@/components/forms/country-select";

type OpportunityApiResponse = ApiSuccess<OpportunityIntelligenceResponse> | ApiError;

const typeOptions: Array<{ value: "" | OpportunityTypeValue; label: string }> = [
  { value: "", label: "All opportunity types" },
  { value: "postdoc", label: "Postdoctoral positions" },
  { value: "phd", label: "PhD positions" },
  { value: "fellowship", label: "Fellowships" },
  { value: "grant", label: "Grants" },
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

function formatDate(value?: string) {
  if (!value) return "Not published";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function typeLabel(value: OpportunityTypeValue) {
  return typeOptions.find((option) => option.value === value)?.label.replace(/s$/, "") ?? value;
}

export function OpportunityExplorer() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"" | OpportunityTypeValue>("");
  const [topic, setTopic] = useState("");
  const [country, setCountry] = useState("");
  const [deadlineWindow, setDeadlineWindow] = useState("");
  const [careerStage, setCareerStage] = useState<"" | OpportunityCareerStage>("");
  const [searchedWithFilters, setSearchedWithFilters] = useState(false);
  const [data, setData] = useState<OpportunityIntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError(null);
    setSearchedWithFilters(Boolean(query.trim() || type || topic || country.trim() || deadlineWindow || careerStage));

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (type) params.set("type", type);
    if (topic) params.set("topic", topic);
    if (country.trim()) params.set("country", country.trim().toUpperCase());
    if (deadlineWindow) params.set("deadlineWithinDays", deadlineWindow);
    if (careerStage) params.set("career", careerStage);
    params.set("limit", "12");

    try {
      const response = await fetch("/api/v1/opportunities?" + params.toString(), {
        headers: { Accept: "application/json" },
      });
      const body = (await response.json()) as OpportunityApiResponse;
      if (!response.ok || !body.success) {
        throw new Error(body.success ? "Opportunity intelligence request failed." : body.error.message);
      }
      setData(body.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Opportunity intelligence request failed.");
    } finally {
      setLoading(false);
    }
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

        <form className={styles.searchForm} onSubmit={runSearch}>
          <div className={styles.intentRow}>
            <label className={styles.intentField}>
              <span className={styles.srOnly}>Opportunity search intent</span>
              <input
                maxLength={240}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="e.g. translational oncology postdoc in Europe"
                value={query}
              />
            </label>
            <button className={styles.searchButton} disabled={loading} type="submit">
              {loading ? "Analyzing…" : "Find opportunities"}
            </button>
          </div>

          <div className={styles.filterGrid}>
            <label>
              <span>Type</span>
              <select onChange={(event) => setType(event.target.value as "" | OpportunityTypeValue)} value={type}>
                {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span>Research topic</span>
              <select onChange={(event) => setTopic(event.target.value)} value={topic}>
                {topicOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span>Country</span>
              <CountrySelect ariaLabel="Country" onChange={setCountry} value={country} />
            </label>
            <label>
              <span>Career stage</span>
              <select onChange={(event) => setCareerStage(event.target.value as "" | OpportunityCareerStage)} value={careerStage}>
                {careerStageOptions.map((option) => <option key={option.value || "any-stage"} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              <span>Deadline</span>
              <select onChange={(event) => setDeadlineWindow(event.target.value)} value={deadlineWindow}>
                <option value="">Any future deadline</option>
                <option value="30">Next 30 days</option>
                <option value="60">Next 60 days</option>
                <option value="90">Next 90 days</option>
                <option value="180">Next 6 months</option>
              </select>
            </label>
          </div>
        </form>
      </section>

      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      <section className={styles.resultsSection}>
        <div className={styles.resultsHeader}>
          <div>
            <span className="sectionLabel">Decision queue</span>
            <h2>{data ? data.results.length + " opportunities worth reviewing" : "Run a source-aware search"}</h2>
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

        {!loading && !data ? (
          <div className={styles.emptyState}>
            <strong>Opportunity Intelligence is ready.</strong>
            <p>Search to compare scientific relevance, published eligibility criteria, source freshness, and application timing.</p>
          </div>
        ) : null}

        {!loading && data?.results.length ? (
          <div className={styles.resultList}>
            {data.results.map((opportunity) => (
              <article className={styles.card} key={opportunity.id}>
                <div className={styles.identity}>
                  <div className={styles.topline}>
                    <span className={styles.type}>{typeLabel(opportunity.type)}</span>
                    <span className={styles.freshness + " " + styles["freshness_" + opportunity.freshness]}>
                      {opportunity.freshness}
                    </span>
                  </div>
                  <h3>{opportunity.title}</h3>
                  <strong>{opportunity.organization}</strong>
                  <p>{opportunity.location}</p>
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

                <aside className={styles.sourceRail}>
                  <div className={styles.sourceBlock}>
                    <span>Original source</span>
                    <strong>{opportunity.source.name}</strong>
                    <small>{opportunity.source.type.replaceAll("-", " ")}</small>
                  </div>
                  <FeedbackControls entityId={opportunity.id} entityType="opportunity" />
                  <a className={styles.secondaryAction} href={opportunity.sourceUrl} rel="noreferrer" target="_blank">Review source</a>
                  <SaveOpportunityButton className={styles.secondaryAction} opportunityId={opportunity.id} />
                  <a className={styles.secondaryAction} href={"/assistant?opportunity=" + opportunity.id}>Ask assistant</a>
                  <a className={styles.primaryAction} href={opportunity.applicationUrl ?? opportunity.sourceUrl} rel="noreferrer" target="_blank">Open application</a>
                </aside>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}
