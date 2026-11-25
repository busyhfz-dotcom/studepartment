import type { Metadata } from "next";
import Link from "next/link";
import { ProductShell } from "@/components/shell/product-shell";
import { getShellViewer } from "@/server/auth/shell-viewer";
import { conferenceCategories } from "./conference-sources";
import styles from "../scanner/scanner.module.css";

export const metadata: Metadata = {
  title: "Conference credibility and continuing education",
  description: "Find specialty society calendars and official registries for conference standing and CME or CPD credit.",
  alternates: { canonical: "/conferences" },
};

export default async function ConferencesPage() {
  const viewer = await getShellViewer();

  return (
    <ProductShell {...viewer}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className="eyebrow">Conferences & Credit</span>
          <h1>Check a conference&apos;s standing before you submit or attend.</h1>
          <p className="lede">
            Credibility checks for venues and journals, the societies behind the major specialty congresses, and
            the registries clinicians use to track CME/CPD credit.
          </p>
          <Link href="/opportunities/directory?group=conferences">Browse conferences, travel awards and prizes</Link>
        </header>

        {conferenceCategories.map((category) => (
          <section className={styles.category} key={category.id}>
            <div className={styles.categoryHeading}>
              <h2>{category.label}</h2>
              <p>{category.intro}</p>
            </div>
            <div className={styles.sourceGrid}>
              {category.sources.map((source) => (
                <a className={styles.sourceCard} href={source.href} key={source.name} rel="noreferrer noopener" target="_blank">
                  <div className={styles.sourceTop}>
                    <strong>{source.name}</strong>

                  </div>
                  <p>{source.description}</p>
                  <div className={styles.sourceMeta}>
                    <span>{source.scope}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}

        <p className={styles.footnote}>
          Ranking and accreditation bodies update independently of Provenant — always confirm current
          status directly with the source before relying on it for a submission or credit-tracking decision.
        </p>
      </div>
    </ProductShell>
  );
}
