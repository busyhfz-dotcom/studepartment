import styles from "./page.module.css";

export default function NewIntroductionPage() {
  return (
    <main className={`shell ${styles.shell}`}>
      <a className="backLink" href="/discover">← Back to discovery</a>
      <header className={styles.header}>
        <span className="eyebrow">Scientific Introduction</span>
        <h1>Review the context before you contact someone.</h1>
        <p className="lede">The recipient should immediately understand who you are, why this is relevant, and what you are asking for.</p>
      </header>

      <section className={styles.previewCard}>
        <div className={styles.personBlock}>
          <span className="sectionLabel">Recipient</span>
          <h2>Dr. Michael Chen</h2>
          <p>Computational Oncologist · Karolinska Institutet</p>
          <span className={styles.availability}>Open to collaboration</span>
        </div>

        <div className={styles.contextBlock}>
          <span className="sectionLabel">Why this introduction is relevant</span>
          <ul>
            <li>Shared focus on pancreatic cancer</li>
            <li>Complementary clinical and imaging expertise</li>
            <li>Compatible collaboration intent</li>
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
            defaultValue="I am working on translational oncology and clinically actionable biomarkers. Your work in computational imaging overlaps with a pancreatic cancer project I am developing, and I would like to explore whether our methods could complement each other."
          />
        </label>

        <div className={styles.guardrail}>
          <strong>Before sending</strong>
          <p>This request will be evaluated against recipient availability and anti-spam rules. Paid plans do not bypass these checks.</p>
        </div>

        <div className={styles.actions}>
          <a className="secondary" href="/discover">Cancel</a>
          <button className="primaryButton" type="button">Send introduction request</button>
        </div>
      </section>
    </main>
  );
}
