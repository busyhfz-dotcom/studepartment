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
            <span className={styles.versionPill}>Discovery v0.4</span>
          </div>
        </div>

        <header className={styles.discoverHeader}>
          <h1>Find the few researchers who fit the work.</h1>
          <p className="lede">
            Search by scientific intent, methods, geography, and collaboration context. Results stay deliberately small and explain their reasoning.
          </p>
        </header>

        <DiscoveryExplorer />
      </div>
    </ProductShell>
  );
}
