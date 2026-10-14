import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./legal-page.module.css";

export const LEGAL_LAST_UPDATED = "14 October 2026";

/**
 * Contact address shown on the legal pages. Set LEGAL_CONTACT_EMAIL in the
 * deployment; the digest sender address is used as a fallback so the pages
 * never publish a placeholder.
 */
export function legalContactEmail(): string | null {
  const value = (process.env.LEGAL_CONTACT_EMAIL ?? process.env.DIGEST_FROM_EMAIL ?? "").trim();
  const match = value.match(/<([^>]+@[^>]+)>/);
  const email = match ? match[1] : value;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function LegalContact() {
  const email = legalContactEmail();
  return email
    ? <a href={`mailto:${email}`}>{email}</a>
    : <>the contact address published by the operator of this deployment</>;
}

export function LegalPage({ current, title, children }: { current: "terms" | "privacy"; title: string; children: ReactNode }) {
  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/start">Provenant</Link>
        <nav aria-label="Legal">
          <Link aria-current={current === "terms" ? "page" : undefined} href="/terms">Terms of Use</Link>
          <Link aria-current={current === "privacy" ? "page" : undefined} href="/privacy">Privacy Notice</Link>
          <Link href="/auth/sign-up">Create an account</Link>
        </nav>
      </header>
      <article className={styles.article}>
        <span className="eyebrow">Provenant · Medical research, worldwide</span>
        <h1>{title}</h1>
        <p className={styles.updated}>Last updated {LEGAL_LAST_UPDATED}</p>
        {children}
      </article>
    </div>
  );
}

export { styles as legalStyles };
