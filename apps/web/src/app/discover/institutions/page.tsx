import { ProductShell } from "@/components/shell/product-shell";
import { getShellViewer } from "@/server/auth/shell-viewer";
import { DiscoveryScopeNav } from "../discovery-scope-nav";
import { InstitutionalExplorer } from "../institutional-explorer";
import styles from "../page.module.css";

export default async function InstitutionDiscoveryPage() {
  const viewer = await getShellViewer();
  return (
    <ProductShell {...viewer}>
      <div className={styles.discoverShell}>
        <DiscoveryScopeNav active="institutions" />

        <div className={styles.pageChrome}>
          <div>
            <span className="eyebrow">Institution Discovery</span>
            <span className={styles.versionPill}>Affiliation-backed intelligence</span>
          </div>
        </div>

        <header className={styles.discoverHeader}>
          <h1>Find research institutions by their scientific ecosystem.</h1>
          <p className="lede">
            Search universities, hospitals, laboratories, institutes, companies, and foundations through affiliation-backed research activity rather than brand visibility.
          </p>
        </header>

        <InstitutionalExplorer entityType="institution" />
      </div>
    </ProductShell>
  );
}
