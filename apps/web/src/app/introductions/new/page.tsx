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
          <h1>Give the recipient enough context to make a decision.</h1>
          <p className="lede">
            Studepartment does not provide unrestricted messaging. Every request is evaluated against scientific context, recipient controls, cooldowns, and anti-spam limits.
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
