import Link from "next/link";
import { ProductShell } from "@/components/shell/product-shell";
import { researcherPreviews } from "@/lib/scientific-data";
import styles from "./page.module.css";

export default async function NewIntroductionPage({ searchParams }: { searchParams: Promise<{ researcher?: string }> }) {
  const { researcher: researcherId } = await searchParams;
  const researcher = researcherPreviews.find((item) => item.id === researcherId) ?? researcherPreviews[0];

  return (
    <ProductShell>
      <div className={styles.shell}>
        <Link className="backLink" href={`/researchers/${researcher.id}`}>← Back to scientific profile</Link>
        <header className={styles.header}>
          <span className="eyebrow">Scientific Introduction</span>
          <h1>Review the context before you contact someone.</h1>
          <p className="lede">The recipient should immediately understand who you are, why this is relevant, and what you are asking for.</p>
        </header>

        <section className={styles.previewCard}>
          <div className={styles.personBlock}>
            <span className="sectionLabel">Recipient</span>
            <h2>{researcher.name}</h2>
            <p>{researcher.title} · {researcher.institution}</p>
            <span className={styles.availability}>Open to {researcher.openTo[0].toLowerCase()}</span>
          </div>

          <div className={styles.contextBlock}>
            <span className="sectionLabel">Why this introduction is relevant</span>
            <ul>
              {researcher.match.reasons.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          </div>
        </section>

        <section className={styles.formCard}>
          <label className={styles.field}>
            <span>Purpose</span>
            <select defaultValue="collaboration">
              <option value="research-discussion">Research discussion</option>
              <option value="collaboration">Collaboration</option>
              <option value="mentorship">Mentorship</option>
              <option value="position-inquiry">Position inquiry</option>
              <option value="grant-partnership">Grant partnership</option>
              <option value="clinical-project">Clinical project</option>
            </select>
          </label>

          <label className={styles.field}>
            <span>Short context</span>
            <textarea
              rows={6}
              defaultValue={`I am working in translational oncology and clinically actionable biomarkers. Your work at ${researcher.institution} overlaps with my current research direction, and I would like to explore whether our expertise could complement each other.`}
            />
          </label>

          <div className={styles.guardrail}>
            <strong>Before sending</strong>
            <p>This request will be evaluated against recipient availability and anti-spam rules. Paid plans do not bypass these checks.</p>
          </div>

          <div className={styles.actions}>
            <Link className="secondary" href={`/researchers/${researcher.id}`}>Cancel</Link>
            <button className="primaryButton" type="button">Send introduction request</button>
          </div>
        </section>
      </div>
    </ProductShell>
  );
}
