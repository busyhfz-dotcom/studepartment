import { ProductShell } from "@/components/shell/product-shell";
import { DiscoveryScopeNav } from "../discovery-scope-nav";
import { InstitutionalExplorer } from "../institutional-explorer";
import styles from "../page.module.css";

export default function LaboratoryDiscoveryPage() {
  return (
    <ProductShell>
      <div className={styles.discoverShell}>
        <DiscoveryScopeNav active="laboratories" />

        <div className={styles.pageChrome}>
          <div>
            <span className="eyebrow">Laboratory Discovery</span>
            <span className={styles.versionPill}>Member-derived evidence</span>
          </div>
        </div>

        <header className={styles.discoverHeader}>
          <h1>Find laboratories by the science they can actually do.</h1>
          <p className="lede">
            Discover research teams through member-derived topics, methods, geography, institutional context, and transparent evidence signals.
          </p>
        </header>

        <InstitutionalExplorer entityType="laboratory" />
      </div>
    </ProductShell>
  );
}
