import { ProductShell } from "@/components/shell/product-shell";
import { getShellViewer } from "@/server/auth/shell-viewer";
import { DiscoveryScopeNav } from "../discovery-scope-nav";
import { InstitutionalExplorer } from "../institutional-explorer";
import styles from "../page.module.css";

export default async function LaboratoryDiscoveryPage() {
  const viewer = await getShellViewer();
  return (
    <ProductShell {...viewer}>
      <div className={styles.discoverShell}>
        <DiscoveryScopeNav active="laboratories" />

        <div className={styles.pageChrome}>
          <div>
            <span className="eyebrow">Laboratory Discovery</span>
            <span className={styles.versionPill}>Member-derived evidence</span>
          </div>
        </div>

        <header className={styles.discoverHeader}>
          <h1>Find labs by the science they do.</h1>
          <p className="lede">
            Find research teams by their members&apos; topics and methods, their location and their institution, with the evidence for each match.
          </p>
        </header>

        <InstitutionalExplorer entityType="laboratory" />
      </div>
    </ProductShell>
  );
}
