"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
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
  const [notice, setNotice] = useState("");

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
    setNotice("");
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
      setNotice(digestFrequency === "off" ? "Weekly digest preference turned off." : "Weekly digest preference saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Notification preferences could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function requestVerification() {
    setSaving(true);
    setError(null);
    setNotice("");
    try {
      const session = await authClient.getSession();
      const email = session.data?.user.email;
      if (!email) throw new Error("Sign in again to verify your email.");
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: new URL("/settings/privacy", window.location.origin).href,
      });
      if (result.error) throw new Error(result.error.message || "Could not request verification.");
      setNotice("Verification requested. Check your inbox and spam folder.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not request verification.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.exportPanel}>
      <div>
        <span className={styles.privateMarker}>Private</span>
        <h2>Research emails and reminders</h2>
        <p>
          Get a weekly summary of new positions and grants, plus reminders for saved deadlines at the lead time you choose.
          Turn research emails off at any time.
        </p>
        {preferences && !preferences.deliveryAvailable ? <p role="status">Email delivery is awaiting platform activation. You can review deadline reminders in <Link href="/opportunities/saved">your saved opportunities</Link>.</p> : null}
        {preferences?.verificationAvailable && !preferences.emailVerified && preferences.digestFrequency === "weekly" ? (
          <p>Verify your account email to receive the digest and reminders. <button type="button" className="secondary" disabled={saving} onClick={() => void requestVerification()}>Verify email</button></p>
        ) : null}
        {notice ? <p role="status">{notice}</p> : null}
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
          Enable research emails
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
