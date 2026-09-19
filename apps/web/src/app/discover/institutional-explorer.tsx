"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type {
  ApiError,
  ApiSuccess,
  InstitutionalDiscoveryResponse,
  InstitutionalEntityType,
  InstitutionalOrganizationType,
} from "@/lib/api-contracts";
import { FeedbackControls } from "@/components/feedback/feedback-controls";
import styles from "./institutional.module.css";

type DiscoveryApiResponse = ApiSuccess<InstitutionalDiscoveryResponse> | ApiError;

type OrganizationTypeOption = { value: "" | InstitutionalOrganizationType; label: string };

const organizationTypeOptions: OrganizationTypeOption[] = [
  { value: "", label: "Any organization type" },
  { value: "university", label: "University" },
  { value: "hospital", label: "Hospital" },
  { value: "research-institute", label: "Research institute" },
  { value: "company", label: "Company" },
  { value: "foundation", label: "Foundation" },
];

function title(value: string) {
  return value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export function InstitutionalExplorer({ entityType }: { entityType: InstitutionalEntityType }) {
  const laboratory = entityType === "laboratory";
  const [query, setQuery] = useState(laboratory ? "translational oncology biomarkers" : "medical research institutions oncology");
  const [topic, setTopic] = useState("oncology");
  const [method, setMethod] = useState("");
  const [country, setCountry] = useState("");
  const [organizationType, setOrganizationType] = useState<"" | InstitutionalOrganizationType>("");
  const [data, setData] = useState<InstitutionalDiscoveryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ type: entityType, limit: "8" });
    if (query.trim()) params.set("q", query.trim());
    if (topic.trim()) params.set("topic", topic.trim());
    if (method.trim()) params.set("method", method.trim());
    if (country.trim()) params.set("country", country.trim().toUpperCase());
    if (organizationType) params.set("organizationType", organizationType);

    try {
      const response = await fetch(`/api/v1/discover/institutional?${params.toString()}`, {
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
    setOrganizationType("");
  }

  return (
    <>
      <section className={styles.workbench}>
        <div className={styles.workbenchHeader}>
          <div>
            <span className="sectionLabel">Scientific intent</span>
            <strong>Search {laboratory ? "laboratories" : "institutions"} by the research they actually represent.</strong>
          </div>
          <span className={styles.mode}>Structured + lexical retrieval</span>
        </div>

        <form className={styles.form} onSubmit={runSearch}>
          <div className={styles.intentRow}>
            <input
              aria-label={`Search ${laboratory ? "laboratories" : "institutions"}`}
              maxLength={240}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={laboratory ? "e.g. spatial oncology labs using single-cell methods" : "e.g. oncology research institutes in Germany"}
              value={query}
            />
            <button className="primaryButton" disabled={loading} type="submit">
              {loading ? "Searching…" : `Search ${laboratory ? "labs" : "institutions"}`}
            </button>
          </div>

          <div className={styles.filters}>
            <label>
              <span>Topic slug</span>
              <input onChange={(event) => setTopic(event.target.value)} placeholder="oncology" value={topic} />
            </label>
            <label>
              <span>Method slug</span>
              <input onChange={(event) => setMethod(event.target.value)} placeholder="single-cell-profiling" value={method} />
            </label>
            <label>
              <span>Country</span>
              <input maxLength={2} onChange={(event) => setCountry(event.target.value)} placeholder="DE" value={country} />
            </label>
            <label>
              <span>Organization type</span>
              <select onChange={(event) => setOrganizationType(event.target.value as "" | InstitutionalOrganizationType)} value={organizationType}>
                {organizationTypeOptions.map((option) => <option key={option.value || "any"} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>

          <div className={styles.formFooter}>
            <div className={styles.contextPills}>
              <span>Canonical affiliations</span>
              <span>Member-derived topics</span>
              <span>Explainable ordering</span>
            </div>
            <button className={styles.clearButton} onClick={clearFilters} type="button">Clear filters</button>
          </div>
        </form>
      </section>

      {error ? <div className={styles.error}>{error}</div> : null}

      <section className={styles.results} aria-live="polite">
        <div className={styles.resultsHeader}>
          <div>
            <span className="sectionLabel">Discovery results</span>
            <h2>{data ? `${data.results.length} focused ${laboratory ? "labs" : "institutions"}` : "Run a focused search"}</h2>
          </div>
          <p>
            Results are ordered by scientific intent, topic and method evidence, geography, public research activity, and trust signals—not reputation or popularity.
          </p>
        </div>

        {!data && !loading ? (
          <div className={styles.empty}>
            <span>⌕</span>
            <div>
              <strong>Search the research ecosystem, not a directory.</strong>
              <p>Describe the scientific capability you need, then narrow with structured filters.</p>
            </div>
          </div>
        ) : null}

        {loading ? <div className={styles.loading}>{[0, 1, 2].map((item) => <div key={item} />)}</div> : null}

        {data && !loading && data.results.length === 0 ? (
          <div className={styles.empty}>
            <span>0</span>
            <div>
              <strong>No credible matches for the current evidence.</strong>
              <p>Broaden a topic, method, geography, or organization-type filter.</p>
            </div>
          </div>
        ) : null}

        {data && !loading ? (
          <div className={styles.list}>
            {data.results.map((result) => (
              <article className={styles.card} key={result.id}>
                <div className={styles.identity}>
                  <div className={styles.identityTopline}>
                    <span className={styles.entityType}>{laboratory ? "Laboratory" : title(result.organizationType)}</span>
                    <span className={styles.score}>{Math.round(result.score * 100)}% match</span>
                  </div>
                  <h3>{result.name}</h3>
                  {result.organizationName ? <strong>{result.organizationName}</strong> : null}
                  <p>{result.location}{result.verified ? " · Verified record" : ""}</p>
                  <div className={styles.tags}>
                    {result.researchInterests.slice(0, 4).map((item) => <span key={item}>{item}</span>)}
                    {result.methods.slice(0, 2).map((item) => <span key={item}>{item}</span>)}
                  </div>
                </div>

                <div className={styles.explanation}>
                  <div className={styles.explanationHeader}>
                    <span className="sectionLabel">Why this result</span>
                    <span>{title(result.confidence)} confidence</span>
                  </div>
                  <ul>
                    {result.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                  </ul>
                  <div className={styles.signals}>
                    {Object.entries(result.scoreBreakdown).map(([label, value]) => (
                      <div className={styles.signal} key={label}>
                        <span>{label}</span>
                        <div><i style={{ width: `${Math.round(value * 100)}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>

                <aside className={styles.metrics}>
                  <div>
                    <span>Researchers</span>
                    <strong>{result.activeResearcherCount}</strong>
                  </div>
                  {!laboratory ? (
                    <div>
                      <span>Labs</span>
                      <strong>{result.labCount}</strong>
                    </div>
                  ) : null}
                  <div>
                    <span>Trust</span>
                    <strong>{result.verified ? "Verified" : title(result.confidence)}</strong>
                  </div>
                  <FeedbackControls entityId={result.id} entityType={laboratory ? "laboratory" : "institution"} />
                  {!laboratory ? <Link href={"/institutions/" + result.id}>Institution intelligence ↗</Link> : null}
                  {result.website ? <a href={result.website} rel="noreferrer" target="_blank">Visit source website ↗</a> : null}
                </aside>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}
