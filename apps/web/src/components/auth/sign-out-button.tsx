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
        className={`secondary ${styles.button}`}
        onClick={signOut}
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
