import Link from "next/link";
import { ProductShell } from "@/components/shell/product-shell";
import { getShellViewer } from "@/server/auth/shell-viewer";
import { OpportunityExplorer } from "./opportunity-explorer";
import styles from "./page.module.css";

export default async function OpportunitiesPage() {
  const viewer = await getShellViewer();
  return (
    <ProductShell {...viewer}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerMeta}>
            <span className="eyebrow">Opportunity Intelligence</span>
            <span className={styles.versionPill}>Source-aware decisions</span>
          </div>
          <h1>Protect your time before you apply.</h1>
          <p className="lede">
            Check how recent each listing is, how well it fits, who can apply and when it closes, before you put work into an application.
          </p>
          <Link href="/opportunities/saved">Your saved opportunities ↗</Link>
        </header>
        <OpportunityExplorer />
      </div>
    </ProductShell>
  );
}
