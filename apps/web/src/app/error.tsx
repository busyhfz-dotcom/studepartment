"use client";

import Link from "next/link";
import { useEffect } from "react";
import styles from "./not-found.module.css";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.page}>
      <Link className={styles.brand} href="/">
        <span className={styles.brandMark} aria-hidden="true">
          <svg fill="none" viewBox="0 0 32 32">
            <path d="M9.2 8.8h8.4a5.2 5.2 0 0 1 0 10.4h-3.2a4.6 4.6 0 0 0 0 9.2h8.4" />
            <circle cx="9.2" cy="8.8" r="2.2" />
            <circle cx="22.8" cy="23.8" r="2.2" />
          </svg>
        </span>
        <strong>Studepartment</strong>
      </Link>
      <span className={styles.code}>Something went wrong</span>
      <h1>We hit an unexpected error rendering this page.</h1>
      <p>
        Your research context and saved data are unaffected — this was a rendering issue, not a data change.
        {error.digest ? ` Reference: ${error.digest}.` : ""}
      </p>
      <div className={styles.actions}>
        <button className="primaryButton" onClick={() => reset()} type="button">Try again</button>
        <Link className="secondary" href="/">Back to your workspace</Link>
      </div>
    </main>
  );
}
