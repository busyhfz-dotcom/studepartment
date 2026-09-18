"use client";

import { useEffect, useState } from "react";
import type { AccountActivitySummary, ApiError, ApiSuccess } from "@/lib/api-contracts";
import styles from "./page.module.css";

type ActivityResponse = ApiSuccess<AccountActivitySummary> | ApiError;

async function loadActivity() {
  const response = await fetch("/api/v1/account/activity", { cache: "no-store" });
  const body = (await response.json()) as ActivityResponse;
  if (!response.ok || !body.success) {
    throw new Error(body.success ? "Activity summary could not be loaded." : body.error.message);
  }
  return body.data;
}

export function PrivacyControls() {
  const [activity, setActivity] = useState<AccountActivitySummary | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void loadActivity()
      .then((data) => {
        if (active) setActivity(data);
      })
      .catch((error: unknown) => {
        if (active) setActivityError(error instanceof Error ? error.message : "Activity summary could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, []);

  async function deleteAccount() {
    if (confirmation !== "DELETE MY ACCOUNT") return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch("/api/v1/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const body = await response.json() as ApiSuccess<{ deleted: boolean }> | ApiError;
      if (!response.ok || !body.success) {
        throw new Error(body.success ? "Account deletion failed." : body.error.message);
      }
      window.location.assign("/auth/sign-in?account=deleted");
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Account deletion failed.");
      setDeleting(false);
    }
  }

  return (
    <>
      <section className={styles.activity}>
        <div className={styles.sectionHeading}>
          <div>
            <span className="sectionLabel">Private activity summary</span>
            <h2>What Studepartment records for product feedback</h2>
          </div>
          <p>No raw search query or Research Assistant prompt is stored in ProductEvent analytics.</p>
        </div>
        {activityError ? <div className={styles.error}>{activityError}</div> : null}
        <div className={styles.metrics}>
          <div><strong>{activity?.feedbackSubmitted ?? "—"}</strong><span>current feedback signals</span></div>
          <div><strong>{activity?.opportunitiesSaved ?? "—"}</strong><span>opportunity saves</span></div>
          <div><strong>{activity?.introductionsSent ?? "—"}</strong><span>introductions sent</span></div>
          <div><strong>{activity?.assistantQueries ?? "—"}</strong><span>assistant uses</span></div>
          <div><strong>{activity?.profileUpdates ?? "—"}</strong><span>profile updates</span></div>
        </div>
      </section>

      <section className={styles.exportPanel}>
        <div>
          <span className="sectionLabel">Data portability</span>
          <h2>Export your account data</h2>
          <p>
            Download a JSON snapshot of your account metadata, Scientific Identity, evidence, saved opportunities,
            introductions, private feedback, and product events. Password hashes, session tokens, OAuth tokens, and application secrets are excluded.
          </p>
        </div>
        <a className="primaryButton" href="/api/v1/account/export">Download JSON export</a>
      </section>

      <section className={styles.deletePanel}>
        <div>
          <span className="sectionLabel">Permanent deletion</span>
          <h2>Delete your account and Scientific Identity</h2>
          <p>
            This deletes your account, sessions, Scientific Identity, authorship relationships, private feedback, saves,
            introduction relationships, and personal provenance. Shared bibliographic publication records may remain as non-personal canonical metadata after your relationship to them is removed.
          </p>
        </div>
        <label>
          <span>Type DELETE MY ACCOUNT</span>
          <input
            autoComplete="off"
            onChange={(event) => setConfirmation(event.target.value)}
            value={confirmation}
          />
        </label>
        {deleteError ? <div className={styles.error}>{deleteError}</div> : null}
        <button
          className={styles.deleteButton}
          disabled={confirmation !== "DELETE MY ACCOUNT" || deleting}
          onClick={() => void deleteAccount()}
          type="button"
        >
          {deleting ? "Deleting account…" : "Permanently delete account"}
        </button>
      </section>
    </>
  );
}
