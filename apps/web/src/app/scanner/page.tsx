import { ProductShell } from "@/components/shell/product-shell";
import { getCurrentUser } from "@/server/auth/current-user";
import { scannerCategories } from "./scanner-sources";
import styles from "./scanner.module.css";

export default async function ScannerPage() {
  const user = await getCurrentUser();

  return (
    <ProductShell accountKind={user?.accountKind === "INSTITUTION" ? "institution" : "individual"}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className="eyebrow">Scanner Directory</span>
          <h1>Every serious position and grant database, in one place.</h1>
          <p className="lede">
            A hand-reviewed directory of the independent databases researchers actually use to find PhD,
            postdoc, and faculty positions and research funding — organized by region so you stop checking
            five tabs. Studepartment does not scrape or mirror these listings; each link opens the source
            directly.
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
          Know a database that belongs here, or one of ours that&apos;s posting live opportunities on
          Studepartment directly? <a href="/opportunities">Search structured Opportunity Intelligence</a> for
          postings already ingested with deadlines, eligibility, and source provenance attached.
        </p>
      </div>
    </ProductShell>
  );
}
