import { ProductShell } from "@/components/shell/product-shell";
import { DiscoveryExplorer } from "./discovery-explorer";
import { DiscoveryScopeNav } from "./discovery-scope-nav";
import styles from "./page.module.css";

export default function DiscoverPage() {
  return (
    <ProductShell>
      <div className={styles.discoverShell}>
        <DiscoveryScopeNav active="researchers" />

        <div className={styles.pageChrome}>
          <div>
            <span className="eyebrow">Scientific Discovery</span>
            <span className={styles.versionPill}>Evidence-aware retrieval</span>
          </div>
        </div>

        <header className={styles.discoverHeader}>
          <h1>Find the researchers whose work fits the question.</h1>
          <p className="lede">
            Search by scientific intent, methods, geography, and collaboration context. Each result exposes the evidence behind the match instead of hiding it inside a score.
          </p>
        </header>

        <DiscoveryExplorer />
      </div>
    </ProductShell>
  );
}
