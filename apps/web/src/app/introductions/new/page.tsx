import Link from "next/link";
import { ProductShell } from "@/components/shell/product-shell";
import { IntroductionComposer } from "./introduction-composer";
import styles from "./page.module.css";

export default async function NewIntroductionPage({
  searchParams,
}: {
  searchParams: Promise<{ researcher?: string }>;
}) {
  const { researcher } = await searchParams;

  return (
    <ProductShell>
      <div className={styles.shell}>
        <Link className="backLink" href={researcher ? "/researchers/" + researcher : "/discover"}>
          ← {researcher ? "Back to scientific profile" : "Back to Discovery"}
        </Link>

        <header className={styles.header}>
          <div className={styles.headerMeta}>
            <span className="eyebrow">Scientific Introduction</span>
            <span className={styles.versionPill}>Controlled outreach</span>
          </div>
          <h1>Give the recipient enough scientific context to decide.</h1>
          <p className="lede">
            Every introduction is evaluated against scientific relevance, recipient controls, cooldowns, and anti-noise limits before it can be sent.
          </p>
        </header>

        {researcher ? (
          <IntroductionComposer receiverId={researcher} />
        ) : (
          <section className={styles.missingRecipient}>
            <strong>Select a researcher before composing an introduction.</strong>
            <p>Use Scientific Discovery to review fit and open the introduction composer from a researcher result.</p>
            <Link className="primaryButton" href="/discover">Open Scientific Discovery</Link>
          </section>
        )}
      </div>
    </ProductShell>
  );
}
