import Link from "next/link";
import { ProductShell } from "@/components/shell/product-shell";
import { OpportunityExplorer } from "./opportunity-explorer";
import styles from "./page.module.css";

export default function OpportunitiesPage() {
  return (
    <ProductShell>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerMeta}>
            <span className="eyebrow">Opportunity Intelligence</span>
            <span className={styles.versionPill}>Source-aware decisions</span>
          </div>
          <h1>Protect your time before you apply.</h1>
          <p className="lede">
            Compare source freshness, scientific relevance, published eligibility, deadlines, and institutional context before committing serious application effort.
          </p>
          <Link href="/opportunities/saved">Open saved workspace ↗</Link>
        </header>
        <OpportunityExplorer />
      </div>
    </ProductShell>
  );
}
