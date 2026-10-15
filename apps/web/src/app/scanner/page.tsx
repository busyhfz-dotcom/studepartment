import Link from "next/link";
import { ProductShell } from "@/components/shell/product-shell";
import { getShellViewer } from "@/server/auth/shell-viewer";
import { scannerCategories } from "./scanner-sources";
import styles from "./scanner.module.css";

export default async function ScannerPage() {
  const viewer = await getShellViewer();

  return (
    <ProductShell {...viewer}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className="eyebrow">Scanner Directory</span>
          <h1>Every serious position and grant database, in one place.</h1>
          <p className="lede">
            A hand-checked list of the independent databases researchers actually use to find PhD, postdoc and
            faculty positions and research funding, grouped by region. Each link opens the source itself. Where a
            publisher offers an open feed, its listings also appear in Provenant search; see{" "}
            <Link href="/sources">Data sources</Link>.
          </p>
        </header>

        {scannerCategories.map((category) => (
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
                    <span>↗</span>
                  </div>
                  <p>{source.description}</p>
                  <div className={styles.sourceMeta}>
                    <span>{source.region}</span>
                    <span>{source.coverage}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}

        <p className={styles.footnote}>
          Looking for listings you can filter by topic, deadline and eligibility?{" "}
          <Link href="/opportunities">Search Opportunity Intelligence</Link>, which collects open positions and
          funding calls from the publishers listed on <Link href="/sources">Data sources</Link>.
        </p>
      </div>
    </ProductShell>
  );
}
