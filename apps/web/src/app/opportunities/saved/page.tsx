import Link from "next/link";
import { ProductShell } from "@/components/shell/product-shell";
import { SavedOpportunityWorkspace } from "./saved-opportunity-workspace";
import styles from "./page.module.css";

export default function SavedOpportunitiesPage() {
  return (
    <ProductShell>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div><span className="eyebrow">Opportunity Workspace</span><span className={styles.version}>v1.1</span></div>
          <h1>Track opportunities without losing source context.</h1>
          <p>Saved opportunities preserve the canonical source, freshness, deadline precision, and your alert window. Saving never changes scientific relevance or eligibility.</p>
          <Link href="/opportunities">← Back to Opportunity Intelligence</Link>
        </header>
        <SavedOpportunityWorkspace />
      </div>
    </ProductShell>
  );
}
