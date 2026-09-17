"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import type {
  ApiError,
  ApiSuccess,
  DiscoveryAvailability,
  ResearcherDiscoveryResponse,
} from "@/lib/api-contracts";
import styles from "./page.module.css";

type DiscoveryApiResponse = ApiSuccess<ResearcherDiscoveryResponse> | ApiError;

const topicOptions = [
  { value: "", label: "All research topics" },
  { value: "oncology", label: "Oncology" },
  { value: "cancer-immunotherapy", label: "Cancer immunotherapy" },
  { value: "biomarkers", label: "Biomarkers" },
  { value: "clinical-trials", label: "Clinical trials" },
  { value: "computational-oncology", label: "Computational oncology" },
];

const methodOptions = [
  { value: "", label: "All methods" },
  { value: "clinical-trial-design", label: "Clinical trial design" },
  { value: "translational-research", label: "Translational research" },
  { value: "biomarker-analysis", label: "Biomarker analysis" },
  { value: "machine-learning", label: "Machine learning" },
];

const availabilityOptions: Array<{ value: "" | DiscoveryAvailability; label: string }> = [
  { value: "", label: "Any availability" },
  { value: "open", label: "Open" },
  { value: "selective", label: "Selective" },
  { value: "quiet", label: "Quiet" },
];

function confidenceLabel(value: "high" | "medium" | "low") {
  if (value === "high") return "High source confidence";
  if (value === "medium") return "Moderate source confidence";
  return "Limited source confidence";
}

export function DiscoveryExplorer() {
  const [query, setQuery] = useState("translational oncology biomarkers Europe");
  const [topic, setTopic] = useState("oncology");
  const [method, setMethod] = useState("translational-research");
  const [country, setCountry] = useState("");
  const [availability, setAvailability] = useState<"" | DiscoveryAvailability>("");
  const [data, setData] = useState<ResearcherDiscoveryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (topic) params.set("topic", topic);
    if (method) params.set("method", method);
    if (country.trim()) params.set("country", country.trim().toUpperCase());
    if (availability) params.set("availability", availability);
    params.set("limit", "8");

    try {
      const response = await fetch(`/api/v1/discover/researchers?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
      const body = (await response.json()) as DiscoveryApiResponse;
      if (!response.ok || !body.success) {
        throw new Error(body.success ? "Discovery request failed." : body.error.message);
      }
      setData(body.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Discovery request failed.");
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setTopic("");
    setMethod("");
    setCountry("");
    setAvailability("");
  }

  return (
    <>
      <section className={styles.discoveryWorkbench}>
        <div className={styles.workbenchTopline}>
          <div>
            <span className="sectionLabel">Research intent</span>
            <p>Describe the scientific problem, expertise, or collaborator you need.</p>
          </div>
          <div className={styles.systemBadge}>Explainable retrieval</div>
        </div>

        <form className={styles.searchForm} onSubmit={runSearch}>
          <div className={styles.intentRow}>
            <label className={styles.intentField}>
              <span className={styles.srOnly}>Scientific search intent</span>
              <input
                aria-label="Scientific search intent"
                maxLength={240}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="e.g. pancreatic cancer imaging collaborators in Germany"
                value={query}
              />
            </label>
            <button className={styles.searchButton} disabled={loading} type="submit">
              {loading ? "Searching…" : "Search researchers"}
            </button>
          </div>

          <div className={styles.filterGrid}>
            <label>
              <span>Research topic</span>
              <select onChange={(event) => setTopic(event.target.value)} value={topic}>
                {topicOptions.map((option) => (
                  <option key={option.value || "all-topics"} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Method</span>
              <select onChange={(event) => setMethod(event.target.value)} value={method}>
                {methodOptions.map((option) => (
                  <option key={option.value || "all-methods"} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Country</span>
              <input
                maxLength={2}
                onChange={(event) => setCountry(event.target.value)}
                placeholder="DE"
                value={country}
              />
            </label>
            <label>
              <span>Availability</span>
              <select
                onChange={(event) => setAvailability(event.target.value as "" | DiscoveryAvailability)}
                value={availability}
              >
                {availabilityOptions.map((option) => (
                  <option key={option.value || "any-availability"} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.searchMetaRow}>
            <div className={styles.metaPills}>
              <span>Canonical scientific identity</span>
              <span>Source-aware confidence</span>
              <span>Maximum 8 results</span>
            </div>
            <button className={styles.clearButton} onClick={clearFilters} type="button">Clear filters</button>
          </div>
        </form>
      </section>

      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      <section className={styles.resultSection} aria-live="polite">
        <div className={styles.resultHeading}>
          <div>
            <span className="sectionLabel">Scientific matches</span>
            <h2>{data ? `${data.results.length} focused results` : "Run a focused search"}</h2>
          </div>
          <p>
            Ordering is based on scientific intent, structured research signals, availability, and source confidence—not popularity.
          </p>
        </div>

        {!data && !loading ? (
          <div className={styles.discoveryEmpty}>
            <div className={styles.emptyMark}>⌕</div>
            <div>
              <strong>Start with a scientific question.</strong>
              <p>Use natural language, then narrow with topic, method, geography, or availability.</p>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className={styles.loadingGrid}>
            {[0, 1, 2].map((item) => <div className={styles.loadingCard} key={item} />)}
          </div>
        ) : null}

        {data && !loading && data.results.length === 0 ? (
          <div className={styles.discoveryEmpty}>
            <div className={styles.emptyMark}>0</div>
            <div>
              <strong>No credible matches in the current candidate set.</strong>
              <p>Broaden one filter rather than receiving low-quality filler results.</p>
            </div>
          </div>
        ) : null}

        {data && !loading ? (
          <div className={styles.resultList}>
            {data.results.map((person) => (
              <article className={styles.resultCard} key={person.id}>
                <div className={styles.resultPrimary}>
                  <div className={styles.resultIdentityTopline}>
                    <span className={styles.matchLabel}>{person.alignment} alignment</span>
                    <span className={styles.scorePill}>{Math.round(person.score * 100)}% match</span>
                  </div>
                  <h3>{person.fullName}</h3>
                  <strong>{person.headline}</strong>
                  <p>{person.institution} · {person.location}</p>
                  <div className={styles.tagRow}>
                    {person.researchInterests.slice(0, 3).map((interest) => <span key={interest}>{interest}</span>)}
                    {person.methods.slice(0, 2).map((methodName) => <span key={methodName}>{methodName}</span>)}
                  </div>
                </div>

                <div className={styles.explanationPanel}>
                  <div className={styles.explanationHeader}>
                    <span className="sectionLabel">Why this result</span>
                    <span className={styles.confidenceBadge}>{confidenceLabel(person.confidence)}</span>
                  </div>
                  <ul className={styles.reasonList}>
                    {person.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                  </ul>
                  <div className={styles.signalBars}>
                    {Object.entries(person.scoreBreakdown).map(([label, value]) => (
                      <div className={styles.signalRow} key={label}>
                        <span>{label}</span>
                        <div className={styles.signalTrack}><i style={{ width: `${Math.round(value * 100)}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.resultRail}>
                  <div className={styles.availabilityBlock}>
                    <span>Availability</span>
                    <strong>{person.availability}</strong>
                  </div>
                  {person.verifiedSignals.length ? (
                    <div className={styles.verifiedStack}>
                      {person.verifiedSignals.slice(0, 3).map((signal) => <span key={signal}>✓ {signal}</span>)}
                    </div>
                  ) : null}
                  <Link className={styles.profileLink} href={`/researchers/${person.id}`}>View profile</Link>
                  <Link className={styles.introLink} href={`/introductions/new?researcher=${person.id}`}>Review introduction</Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}
