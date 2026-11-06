import Link from "next/link";
import type { Metadata } from "next";
import { ProductShell } from "@/components/shell/product-shell";
import { getShellViewer } from "@/server/auth/shell-viewer";
import { scannerCategories } from "./scanner-sources";
import { getOpportunitySourceStatus } from "@/server/opportunities/sources/sync";
import styles from "./scanner.module.css";

export const metadata: Metadata = {
  title: "Research opportunity source directory",
  description: "Find official research job boards and funding portals, and see which feeds Provenant searches.",
  alternates: { canonical: "/scanner" },
};

export default async function ScannerPage() {
  const [viewer, feeds] = await Promise.all([getShellViewer(), getOpportunitySourceStatus().catch(() => [])]);
  const statusById = new Map(feeds.map((feed) => [feed.id, feed]));

  return (
    <ProductShell {...viewer}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className="eyebrow">Scanner Directory</span>
          <h1>Find official research job and funding sources.</h1>
          <p className="lede">
            Browse independent job boards and funding portals by region. Directory links open the original publisher.
            See <Link href="/sources">Data sources</Link> for connected feeds, listing counts and the latest checks.
          </p>
        </header>

        {scannerCategories.map((category) => (
          <section className={styles.category} key={category.id}>
            <div className={styles.categoryHeading}>
              <h2>{category.label}</h2>
              <p>{category.intro}</p>
            </div>
            <div className={styles.sourceGrid}>
              {category.sources.map((source) => {
                const feed = source.connectorId ? statusById.get(source.connectorId) : undefined;
                const coverage = feed?.enabled
                  ? feed.activeListings > 0 ? `${feed.activeListings.toLocaleString("en")} listings in Provenant` : "Connected feed"
                  : source.connectorId ? "Check feed status" : "Publisher directory";
                return (
                <a className={styles.sourceCard} href={source.href} key={source.name} rel="noreferrer noopener" target="_blank">
                  <div className={styles.sourceTop}>
                    <strong>{source.name}</strong>
                    <span>↗</span>
                  </div>
                  <p>{source.description}</p>
                  <div className={styles.sourceMeta}>
                    <span>{source.region}</span>
                    <span>{source.coverage}</span>
                    <span>{coverage}</span>
                  </div>
                </a>
                );
              })}
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
