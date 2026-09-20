import Link from "next/link";
import { ProductShell } from "@/components/shell/product-shell";
import { SavedOpportunityWorkspace } from "./saved-opportunity-workspace";
import styles from "./page.module.css";

export default function SavedOpportunitiesPage() {
  return (
    <ProductShell>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className="eyebrow">Opportunity Decision Workspace</span>
          <h1>Review source-backed opportunities as decisions, not bookmarks.</h1>
          <p>
            Keep source context, freshness, deadline precision, alerts, and your own notes visible in one place.
            Saving an opportunity never changes scientific relevance or formal eligibility.
          </p>
          <Link href="/opportunities">← Back to Opportunity Intelligence</Link>
        </header>
        <SavedOpportunityWorkspace />
      </div>
    </ProductShell>
  );
}
