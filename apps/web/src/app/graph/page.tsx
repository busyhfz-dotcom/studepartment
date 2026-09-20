import { ProductShell } from "@/components/shell/product-shell";
import { ScientificGraphExplorer } from "./scientific-graph-explorer";
import styles from "./page.module.css";

export default async function ScientificGraphPage({
  searchParams,
}: {
  searchParams: Promise<{ researcher?: string }>;
}) {
  const { researcher } = await searchParams;

  return (
    <ProductShell>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerMeta}>
            <span className="eyebrow">Scientific Evidence Graph</span>
            <span className={styles.versionPill}>Derived canonical relationships</span>
          </div>
          <h1>Map the evidence around a scientific identity.</h1>
          <p className="lede">
            Trace publications, topics, methods, laboratories, institutions, and current opportunities as explicit relationships derived from canonical product data—not as a hidden researcher score.
          </p>
        </header>
        <ScientificGraphExplorer researcherId={researcher} />
      </div>
    </ProductShell>
  );
}
