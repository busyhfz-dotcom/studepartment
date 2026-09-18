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
            <span className={styles.versionPill}>v0.9</span>
          </div>
          <h1>See the evidence around a scientific identity.</h1>
          <p className="lede">
            Publications, research topics, methods, laboratories, institutions, and current opportunities are derived from canonical product data and shown as explainable relationships rather than a hidden researcher score.
          </p>
        </header>
        <ScientificGraphExplorer researcherId={researcher} />
      </div>
    </ProductShell>
  );
}
