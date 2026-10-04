"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import styles from "./sign-out-button.module.css";

export function SignOutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    if (pending) return;
    setPending(true);
    setError(null);

    try {
      const result = await authClient.signOut();
      if (result.error) {
        setError("Unable to sign out. Please try again.");
        setPending(false);
        return;
      }
      window.location.replace("/auth/sign-in");
    } catch {
      setError("Unable to sign out. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className={styles.control}>
      <button
        type="button"
        className={styles.button}
        onClick={signOut}
        disabled={pending}
        aria-busy={pending}
      >
        <span className={styles.icon} aria-hidden="true">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M13 7l5 5-5 5M18 12H9" />
          </svg>
        </span>
        <span className={styles.copy}>
          <strong>{pending ? "Signing out…" : "Sign out"}</strong>
          <small>Leave your workspace</small>
        </span>
      </button>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
