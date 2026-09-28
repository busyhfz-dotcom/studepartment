import { ProductShell } from "@/components/shell/product-shell";
import { getCurrentUser } from "@/server/auth/current-user";
import { conferenceCategories } from "./conference-sources";
import styles from "../scanner/scanner.module.css";

export default async function ConferencesPage() {
  const user = await getCurrentUser();

  return (
    <ProductShell accountKind={user?.accountKind === "INSTITUTION" ? "institution" : "individual"}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className="eyebrow">Conferences & Credit</span>
          <h1>Check a conference&apos;s standing before you submit or attend.</h1>
          <p className="lede">
            Independent ranking, call-for-papers, and continuing-education-credit registries — useful for
            evaluating a venue&apos;s credibility or tracking CME/CPD credit for clinical work.
          </p>
        </header>

        {conferenceCategories.map((category) => (
          <section className={styles.category} key={category.id}>
            <div className={styles.categoryHeading}>
              <h2>{category.label}</h2>
              <p>{category.intro}</p>
            </div>
            <div className={styles.sourceGrid}>
              {category.sources.map((source) => (
                <a className={styles.sourceCard} href={source.href} key={source.name} rel="noreferrer noopener" target="_blank">
                  <div className={styles.sourceTop}>
                    <strong>{source.name}</strong>
                    <span>↗</span>
                  </div>
                  <p>{source.description}</p>
                  <div className={styles.sourceMeta}>
                    <span>{source.scope}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}

        <p className={styles.footnote}>
          Ranking and accreditation bodies update independently of Studepartment — always confirm current
          status directly with the source before relying on it for a submission or credit-tracking decision.
        </p>
      </div>
    </ProductShell>
  );
}
