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
            <span className="sectionLabel">Private activity</span>
            <h2>Account activity used inside your research workspace</h2>
            <p>
              These counts describe your own product activity. They are not reputation signals and are not presented as
              public Scientific Identity metrics.
            </p>
          </div>
          <span className={styles.privateMarker}>Private to account</span>
        </div>

        {activityError ? <div className={styles.error}>{activityError}</div> : null}

        <div className={styles.metrics} aria-label="Private account activity counts">
          <div><strong>{activity?.feedbackSubmitted ?? "—"}</strong><span>feedback signals</span></div>
          <div><strong>{activity?.opportunitiesSaved ?? "—"}</strong><span>opportunities under review</span></div>
          <div><strong>{activity?.introductionsSent ?? "—"}</strong><span>introduction requests sent</span></div>
          <div><strong>{activity?.assistantQueries ?? "—"}</strong><span>Research Assistant uses</span></div>
          <div><strong>{activity?.profileUpdates ?? "—"}</strong><span>Scientific Identity updates</span></div>
        </div>

        <p className={styles.activityNote}>
          ProductEvent analytics do not store raw search queries or raw Research Assistant prompts.
        </p>
      </section>

      <section className={styles.exportPanel}>
        <div>
          <span className="sectionLabel">Data export</span>
          <h2>Export a portable account record</h2>
          <p>
            Download a JSON snapshot containing account metadata, Scientific Identity, evidence relationships, saved
            opportunities, introductions, private feedback, and product events.
          </p>
          <div className={styles.exportDetails}>
            <span>Included: account and research-workspace records</span>
            <span>Excluded: password hashes, session tokens, OAuth tokens, application secrets</span>
          </div>
        </div>
        <a className="primaryButton" href="/api/v1/account/export">Download JSON export</a>
      </section>

      <section className={styles.deletePanel}>
        <div className={styles.deleteIntro}>
          <span className="sectionLabel">Account deletion</span>
          <h2>Permanently delete the account and Scientific Identity</h2>
          <p>
            Deletion removes the user-owned account and research identity relationships. The distinction below explains
            what is removed and what can remain as non-personal canonical research metadata.
          </p>
        </div>

        <div className={styles.deletionGrid}>
          <div className={styles.deletionFact}>
            <strong>Removed with the account</strong>
            <span>
              Sessions, Scientific Identity, authorship relationships, private feedback, saved opportunities,
              introduction relationships, and personal provenance attached to the account.
            </span>
          </div>
          <div className={styles.deletionFact}>
            <strong>Canonical records may remain</strong>
            <span>
              Shared bibliographic publication records may remain as non-personal canonical metadata after the
              account-specific relationship to those records is removed.
            </span>
          </div>
        </div>

        <div className={styles.confirmationArea}>
          <label>
            <span>Type DELETE MY ACCOUNT to confirm permanent deletion</span>
            <input
              autoComplete="off"
              onChange={(event) => setConfirmation(event.target.value)}
              value={confirmation}
            />
          </label>
          <button
            className={styles.deleteButton}
            disabled={confirmation !== "DELETE MY ACCOUNT" || deleting}
            onClick={() => void deleteAccount()}
            type="button"
          >
            {deleting ? "Deleting account…" : "Permanently delete account"}
          </button>
        </div>

        {deleteError ? <div className={styles.error}>{deleteError}</div> : null}
      </section>
    </>
  );
}
