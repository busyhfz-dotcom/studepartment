"use client";

import { useEffect, useState } from "react";
import type { ApiError, ApiSuccess, SavedOpportunityListResponse } from "@/lib/api-contracts";
import styles from "./page.module.css";

type Response = ApiSuccess<SavedOpportunityListResponse> | ApiError;

function date(value?: string) {
  if (!value) return "No exact deadline";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export function SavedOpportunityWorkspace() {
  const [data, setData] = useState<SavedOpportunityListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/v1/opportunities/saved", { cache: "no-store" });
    const body = (await response.json()) as Response;
    if (!response.ok || !body.success) throw new Error(body.success ? "Unable to load saved opportunities." : body.error.message);
    setData(body.data);
  }

  useEffect(() => {
    void load().catch((e: unknown) => setError(e instanceof Error ? e.message : "Unable to load saved opportunities."));
  }, []);

  async function remove(opportunityId: string) {
    const response = await fetch("/api/v1/opportunities/saved?opportunity=" + encodeURIComponent(opportunityId), { method: "DELETE" });
    if (response.ok) await load();
  }

  if (error) return <div className={styles.error}>{error}</div>;
  if (!data) return <div className={styles.loading}>Loading opportunity workspace…</div>;

  return (
    <>
      <section className={styles.summary}>
        <div><strong>{data.total}</strong><span>saved opportunities</span></div>
        <div><strong>{data.dueSoon}</strong><span>inside your alert window</span></div>
        <div><strong>7–90d</strong><span>supported deadline lead time</span></div>
      </section>

      {data.saved.length === 0 ? (
        <section className={styles.empty}>
          <strong>Your opportunity workspace is empty.</strong>
          <p>Save a source-backed opportunity from Opportunity Intelligence to track its deadline without turning the product into an engagement feed.</p>
        </section>
      ) : (
        <section className={styles.list}>
          {data.saved.map((item) => (
            <article className={styles.card} key={item.id}>
              <div>
                <div className={styles.topline}>
                  <span>{item.opportunity.type.replaceAll("-", " ")}</span>
                  <span>{item.opportunity.freshness}</span>
                </div>
                <h2>{item.opportunity.title}</h2>
                <p>{item.opportunity.organization}</p>
              </div>
              <div className={styles.deadline}>
                <span>Deadline</span>
                <strong>{item.opportunity.deadlinePrecision === "rolling" ? "Rolling" : date(item.opportunity.deadline)}</strong>
                <small>{item.deadlineAlert ? item.alertLeadDays + "-day alert armed" : "Alert off"}</small>
              </div>
              <div className={styles.actions}>
                <a href={item.opportunity.sourceUrl} rel="noreferrer" target="_blank">Review source</a>
                <a href={item.opportunity.applicationUrl ?? item.opportunity.sourceUrl} rel="noreferrer" target="_blank">Application ↗</a>
                <button onClick={() => void remove(item.opportunityId)} type="button">Remove</button>
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  );
}
