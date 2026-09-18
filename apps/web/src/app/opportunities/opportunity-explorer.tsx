"use client";

import { FormEvent, useState } from "react";
import type {
  ApiError,
  ApiSuccess,
  OpportunityIntelligenceResponse,
  OpportunityTypeValue,
} from "@/lib/api-contracts";
import styles from "./page.module.css";

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

const topicOptions = [
  { value: "", label: "All research topics" },
  { value: "oncology", label: "Oncology" },
  { value: "cancer-immunotherapy", label: "Cancer immunotherapy" },
  { value: "biomarkers", label: "Biomarkers" },
  { value: "clinical-trials", label: "Clinical trials" },
  { value: "computational-oncology", label: "Computational oncology" },
];

function formatDate(value?: string) {
  if (!value) return "Not published";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function typeLabel(value: OpportunityTypeValue) {
  return typeOptions.find((option) => option.value === value)?.label.replace(/s$/, "") ?? value;
}

export function OpportunityExplorer() {
  const [query, setQuery] = useState("translational oncology");
  const [type, setType] = useState<"" | OpportunityTypeValue>("");
  const [topic, setTopic] = useState("oncology");
  const [country, setCountry] = useState("");
  const [deadlineWindow, setDeadlineWindow] = useState("90");
  const [data, setData] = useState<OpportunityIntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (type) params.set("type", type);
    if (topic) params.set("topic", topic);
    if (country.trim()) params.set("country", country.trim().toUpperCase());
    if (deadlineWindow) params.set("deadlineWithinDays", deadlineWindow);
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
              <input maxLength={2} onChange={(event) => setCountry(event.target.value)} placeholder="DE" value={country} />
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
            <strong>No current opportunities meet these constraints.</strong>
            <p>Broaden one scientific or deadline filter rather than receiving stale or low-quality filler records.</p>
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
                    <span>Canonical source</span>
                    <strong>{opportunity.source.name}</strong>
                    <small>{opportunity.source.type.replaceAll("-", " ")}</small>
                  </div>
                  <a className={styles.secondaryAction} href={opportunity.sourceUrl} rel="noreferrer" target="_blank">Review source</a>
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
