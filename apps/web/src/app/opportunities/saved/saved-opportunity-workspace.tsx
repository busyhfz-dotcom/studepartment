"use client";

import { DocumentManager } from "@/components/files/document-manager";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SaveOpportunityButton } from "../save-opportunity-button";
import type { ApiError, ApiSuccess, SavedOpportunityListResponse, SavedOpportunityRecord } from "@/lib/api-contracts";
import styles from "./page.module.css";

type Response = ApiSuccess<SavedOpportunityListResponse> | ApiError;

function date(value?: string) {
  if (!value) return "No exact deadline";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function sourceHost(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "Canonical source";
  }
}

function titleCase(value: string) {
  return value.replaceAll("-", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

const applicationStages: Array<[SavedOpportunityRecord["applicationStage"], string]> = [
  ["saved", "Saved"],
  ["preparing", "Preparing application"],
  ["applied", "Applied"],
  ["interview", "Interview / review"],
  ["decision", "Decision received"],
  ["closed", "Closed"],
];

function ApplicationTracker({ item, onSaved }: { item: SavedOpportunityRecord; onSaved: () => Promise<void> }) {
  const [stage, setStage] = useState(item.applicationStage);
  const [notes, setNotes] = useState(item.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/v1/opportunities/saved", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: item.opportunityId, applicationStage: stage, notes }),
      });
      const body = await response.json() as { success: boolean; error?: { message?: string } };
      if (!response.ok || !body.success) throw new Error(body.error?.message ?? "Could not save application progress.");
      await onSaved();
      setMessage("Progress saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save application progress.");
    } finally {
      setSaving(false);
    }
  }
  return <div className={styles.tracker}>
    <label><span>Application stage</span><select value={stage} onChange={(event) => setStage(event.target.value as SavedOpportunityRecord["applicationStage"])}>{applicationStages.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
    <label><span>Private application notes</span><textarea maxLength={1000} rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Tasks, contacts, documents, next step…" /></label>
    <button disabled={saving} onClick={() => void save()} type="button">{saving ? "Saving…" : "Save progress"}</button>
    {message ? <p role="status">{message}</p> : null}
  </div>;
}

function ApplicationDocuments({ opportunityId }: { opportunityId: string }) {
  const [open, setOpen] = useState(false);
  return <details className={styles.documents} onToggle={(event) => setOpen(event.currentTarget.open)}><summary>Application documents</summary>{open ? <DocumentManager scope="application" contextId={opportunityId} title="Private application documents" /> : null}</details>;
}

export function SavedOpportunityWorkspace({ pendingOpportunityId }: { pendingOpportunityId?: string }) {
  const [data, setData] = useState<SavedOpportunityListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/v1/opportunities/saved", { cache: "no-store" });
    const body = (await response.json()) as Response;
    if (!response.ok || !body.success) throw new Error(body.success ? "Unable to load saved opportunities." : body.error.message);
    setData(body.data);
  }

  useEffect(() => {
    let active = true;
    void fetch("/api/v1/opportunities/saved", { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json()) as Response;
        if (!response.ok || !body.success) {
          throw new Error(body.success ? "Unable to load saved opportunities." : body.error.message);
        }
        return body.data;
      })
      .then((next) => {
        if (active) setData(next);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : "Unable to load saved opportunities.");
      });
    return () => {
      active = false;
    };
  }, []);

  async function remove(opportunityId: string) {
    try {
      const response = await fetch("/api/v1/opportunities/saved?opportunity=" + encodeURIComponent(opportunityId), { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to remove this opportunity. Please try again.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to remove this opportunity.");
    }
  }

  if (error) return <div className={styles.error} role="alert">{error} <button type="button" onClick={() => void load().then(() => setError(null)).catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load saved opportunities."))}>Try again</button></div>;
  if (!data) return <div className={styles.loading}>Loading opportunity decision workspace…</div>;

  return (
    <>
      {pendingOpportunityId && !data.saved.some((item) => item.opportunityId === pendingOpportunityId) ? <section className={styles.empty}>
        <strong>Continue tracking the opportunity you selected</strong>
        <p>Save it to your private workspace to manage progress, notes and application documents.</p>
        <SaveOpportunityButton className="primaryButton" opportunityId={pendingOpportunityId} onSaved={load} />
      </section> : null}
      <section className={styles.summary} aria-label="Opportunity decision summary">
        <div>
          <strong>{data.total}</strong>
          <span>source-backed opportunities under review</span>
        </div>
        <div>
          <strong>{data.dueSoon}</strong>
          <span>inside your configured alert window</span>
        </div>
        <div className={styles.summaryContext}>
          <strong>Decision context stays separate from ranking.</strong>
          <span>Freshness, source, deadline precision, and your notes are shown without creating a hidden opportunity score.</span>
        </div>
      </section>

      {data.saved.length === 0 ? (
        <section className={styles.empty}>
          <strong>No opportunities are under review yet.</strong>
          <p>
            Add a source-backed opportunity from Opportunity Intelligence when you want to preserve its source,
            deadline context, and private decision notes.
          </p>
          <Link className="secondary" href="/opportunities">Find opportunities →</Link>
        </section>
      ) : (
        <section className={styles.list} aria-label="Saved opportunity decisions">
          {data.saved.map((item) => (
            <article className={styles.card} key={item.id}>
              <div className={styles.primaryContext}>
                <div className={styles.topline}>
                  <span className={styles.tag}>{titleCase(item.opportunity.type)}</span>
                  <span className={styles.tag} data-freshness={item.opportunity.freshness}>
                    {titleCase(item.opportunity.freshness)}
                  </span>
                  <span className={styles.tag} data-status={item.opportunity.status}>
                    {titleCase(item.opportunity.status)}
                  </span>
                </div>
                <h2>{item.opportunity.title}</h2>
                <p className={styles.organization}>{item.opportunity.organization}</p>
                <div className={styles.sourceLine}>
                  <span>{sourceHost(item.opportunity.sourceUrl)}</span>
                  <span>saved {dateTime(item.savedAt)}</span>
                </div>
                {item.notes ? <p className={styles.notes}>{item.notes}</p> : null}
              </div>

              <div className={styles.decisionContext}>
                <ApplicationTracker item={item} onSaved={load} />
                <div className={styles.fact}>
                  <span>Deadline</span>
                  <strong>{item.opportunity.deadlinePrecision === "rolling" ? "Rolling" : date(item.opportunity.deadline)}</strong>
                  <small>Precision: {titleCase(item.opportunity.deadlinePrecision)}</small>
                </div>
                <div className={styles.fact}>
                  <span>Alert state</span>
                  <strong>{item.deadlineAlert ? "Active" : "Off"}</strong>
                  <small>{item.deadlineAlert ? item.alertLeadDays + "-day lead time" : "No deadline alert configured"}</small>
                </div>
              </div>

              <div className={styles.actions}>
                <a href={item.opportunity.sourceUrl} rel="noreferrer" target="_blank">Open source ↗</a>
                <a href={item.opportunity.applicationUrl ?? item.opportunity.sourceUrl} rel="noreferrer" target="_blank">Open application ↗</a>
                <button onClick={() => void remove(item.opportunityId)} type="button">Remove from workspace</button>
              </div>
              <ApplicationDocuments opportunityId={item.opportunityId} />
            </article>
          ))}
        </section>
      )}
    </>
  );
}
