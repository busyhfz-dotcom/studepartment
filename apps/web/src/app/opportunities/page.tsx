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
            <span className={styles.versionPill}>v0.6</span>
          </div>
          <h1>Know what deserves your application time.</h1>
          <p className="lede">
            Source freshness, scientific relevance, and formal eligibility remain separate so a compelling research match is never presented as guaranteed eligibility.
          </p>
        </header>
        <OpportunityExplorer />
      </div>
    </ProductShell>
  );
}
