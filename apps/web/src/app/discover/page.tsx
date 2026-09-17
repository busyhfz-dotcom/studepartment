import Link from "next/link";
import { DiscoveryExplorer } from "./discovery-explorer";
import styles from "./page.module.css";

export default function DiscoverPage() {
  return (
    <main className={`shell ${styles.discoverShell}`}>
      <div className={styles.pageChrome}>
        <Link className="backLink" href="/">← Studepartment</Link>
        <span className={styles.versionPill}>Discovery v0.3</span>
      </div>

      <header className={styles.discoverHeader}>
        <span className="eyebrow">Scientific Discovery</span>
        <h1>Find the few researchers who fit the work.</h1>
        <p className="lede">
          Search by scientific intent, methods, geography, and collaboration context. Results stay deliberately small and explain their reasoning.
        </p>
      </header>

      <DiscoveryExplorer />
    </main>
  );
}
