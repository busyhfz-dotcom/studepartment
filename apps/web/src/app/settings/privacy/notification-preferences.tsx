"use client";

import { useEffect, useState } from "react";
import type { ApiError, ApiSuccess, DigestFrequencyValue, NotificationPreferencesResponse } from "@/lib/api-contracts";
import styles from "./page.module.css";

type PreferencesResponse = ApiSuccess<NotificationPreferencesResponse> | ApiError;

async function loadPreferences() {
  const response = await fetch("/api/v1/account/notifications", { cache: "no-store" });
  const body = (await response.json()) as PreferencesResponse;
  if (!response.ok || !body.success) {
    throw new Error(body.success ? "Notification preferences could not be loaded." : body.error.message);
  }
  return body.data;
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferencesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void loadPreferences()
      .then((data) => {
        if (active) setPreferences(data);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Notification preferences could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, []);

  async function setFrequency(digestFrequency: DigestFrequencyValue) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/account/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ digestFrequency }),
      });
      const body = (await response.json()) as PreferencesResponse;
      if (!response.ok || !body.success) {
        throw new Error(body.success ? "Notification preferences could not be saved." : body.error.message);
      }
      setPreferences(body.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Notification preferences could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.exportPanel}>
      <div>
        <span className={styles.privateMarker}>Private</span>
        <h2>Weekly research digest</h2>
        <p>
          A single weekly email summarizing new positions and grants matched to your scientific profile.
          No engagement pressure, no daily noise — you can turn it off at any time.
        </p>
        {preferences?.lastDigestSentAt ? (
          <p className={styles.activityNote}>
            Last sent {new Date(preferences.lastDigestSentAt).toLocaleDateString()}.
          </p>
        ) : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
      </div>
      <div>
        <button
          type="button"
          className={preferences?.digestFrequency === "weekly" ? "primaryButton" : "secondary"}
          disabled={saving || !preferences}
          onClick={() => setFrequency("weekly")}
        >
          Weekly digest on
        </button>
        <button
          type="button"
          className={preferences?.digestFrequency === "off" ? "primaryButton" : "secondary"}
          disabled={saving || !preferences}
          onClick={() => setFrequency("off")}
          style={{ marginLeft: 8 }}
        >
          Off
        </button>
      </div>
    </section>
  );
}
