import Link from "next/link";
import styles from "./not-found.module.css";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
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
        <strong>Provenant</strong>
      </Link>
      <span className={styles.code}>404 · Not found</span>
      <h1>We couldn&apos;t find that page.</h1>
      <p>
        It may have moved or been renamed, or the link may be wrong. Your account and saved work are not
        affected.
      </p>
      <div className={styles.actions}>
        <Link className="primaryButton" href="/">Back to your workspace</Link>
        <Link className="secondary" href="/discover">Open Discovery</Link>
      </div>
    </main>
  );
}
