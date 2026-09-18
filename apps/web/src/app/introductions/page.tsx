import { ProductShell } from "@/components/shell/product-shell";
import { IntroductionWorkspace } from "./introduction-workspace";
import styles from "./page.module.css";

export default async function IntroductionsPage({
  searchParams,
}: {
  searchParams: Promise<{ box?: string }>;
}) {
  const { box } = await searchParams;
  const initialBox = box === "outbox" ? "outbox" : "inbox";

  return (
    <ProductShell>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerMeta}>
            <span className="eyebrow">Scientific Introductions</span>
            <span className={styles.versionPill}>v0.7</span>
          </div>
          <h1>Open fewer conversations, with better scientific context.</h1>
          <p className="lede">
            Requests are controlled by recipient preferences, relevance checks, cooldowns, and rate limits. This is a scientific introduction layer, not an unrestricted inbox.
          </p>
        </header>
        <IntroductionWorkspace initialBox={initialBox} />
      </div>
    </ProductShell>
  );
}
