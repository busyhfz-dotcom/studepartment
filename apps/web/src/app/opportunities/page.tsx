import styles from "./page.module.css";

const opportunities = [
  {
    type: "Postdoc",
    title: "Translational Cancer Immunology",
    organization: "Karolinska Institutet",
    location: "Stockholm, Sweden",
    fit: "Strong fit",
    deadline: "15 Oct 2026",
    strengths: ["Cancer immunotherapy", "Clinical research", "Biomarker experience"],
    gaps: ["Confirm wet-lab methodology requirement"],
  },
  {
    type: "Fellowship",
    title: "Early Career Fellowship · Precision Oncology",
    organization: "University of Oxford",
    location: "Oxford, UK",
    fit: "Worth reviewing",
    deadline: "3 Nov 2026",
    strengths: ["Translational oncology", "Compatible career stage"],
    gaps: ["Review funding-history requirement", "Confirm geographic eligibility"],
  },
];

export default function OpportunitiesPage() {
  return (
    <main className={`shell ${styles.shell}`}>
      <a className="backLink" href="/">← Studepartment</a>
      <header className={styles.header}>
        <span className="eyebrow">Opportunity Intelligence · v0.4</span>
        <h1>Know what deserves your application time.</h1>
        <p className="lede">Relevance and eligibility are shown separately so a promising scientific match is never confused with formal eligibility.</p>
      </header>

      <section className={styles.filters}>
        <button type="button">Postdoc + Fellowship</button>
        <button type="button">Oncology</button>
        <button type="button">Europe</button>
        <button type="button">Next 90 days</button>
      </section>

      <div className={styles.list}>
        {opportunities.map((opportunity) => (
          <article className={styles.card} key={opportunity.title}>
            <div className={styles.identity}>
              <span className={styles.type}>{opportunity.type}</span>
              <h2>{opportunity.title}</h2>
              <strong>{opportunity.organization}</strong>
              <p>{opportunity.location} · Deadline {opportunity.deadline}</p>
            </div>

            <div className={styles.analysis}>
              <span className="sectionLabel">Your analysis</span>
              <strong className={styles.fit}>{opportunity.fit}</strong>
              <div className={styles.columns}>
                <div>
                  <small>Strengths</small>
                  <ul>{opportunity.strengths.map((item) => <li key={item}>✓ {item}</li>)}</ul>
                </div>
                <div>
                  <small>Check before applying</small>
                  <ul>{opportunity.gaps.map((item) => <li key={item}>△ {item}</li>)}</ul>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button className="primaryButton" type="button">Analyze opportunity</button>
              <button className={styles.saveButton} type="button">Save</button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
