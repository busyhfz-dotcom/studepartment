import styles from "./page.module.css";

const people = [
  {
    name: "Dr. Michael Chen",
    headline: "Computational Oncologist",
    institution: "Karolinska Institutet",
    match: "Strong alignment",
    reasons: ["Pancreatic cancer", "Medical imaging", "Open to collaboration"],
  },
  {
    name: "Prof. Elena Rossi",
    headline: "Professor of Translational Oncology",
    institution: "University of Milan",
    match: "Relevant",
    reasons: ["Tumor biomarkers", "Clinical trials", "Selective availability"],
  },
  {
    name: "Dr. Amir Haddad",
    headline: "Biomedical AI Researcher",
    institution: "INSERM",
    match: "Complementary expertise",
    reasons: ["Deep learning", "Pathology imaging", "Grant collaboration"],
  },
];

export default function DiscoverPage() {
  return (
    <main className={`shell ${styles.discoverShell}`}>
      <a className="backLink" href="/">← Studepartment</a>
      <header className={styles.discoverHeader}>
        <span className="eyebrow">Scientific Discovery · v0.3</span>
        <h1>Find a small number of people worth knowing.</h1>
        <p className="lede">Search by scientific intent rather than browsing an endless directory.</p>
      </header>

      <section className={styles.searchPanel}>
        <label className={styles.searchField}>
          <span>What are you trying to find?</span>
          <input defaultValue="Researchers working on AI-assisted pancreatic cancer diagnosis in Europe" />
        </label>
        <div className={styles.filterRow}>
          <button type="button">Topic · Oncology</button>
          <button type="button">Method · AI / Imaging</button>
          <button type="button">Region · Europe</button>
          <button type="button">Availability · Open / Selective</button>
        </div>
      </section>

      <section className={styles.resultSection}>
        <div className={styles.resultHeading}>
          <div>
            <span className="sectionLabel">Best current matches</span>
            <h2>3 researchers</h2>
          </div>
          <p>Results are intentionally capped and ordered by scientific relevance, intent compatibility, and confidence.</p>
        </div>

        <div className={styles.resultList}>
          {people.map((person, index) => (
            <article className={styles.resultCard} key={person.name}>
              <div className={styles.resultIdentity}>
                <span className={styles.matchLabel}>{person.match}</span>
                <h3>{person.name}</h3>
                <strong>{person.headline}</strong>
                <p>{person.institution}</p>
              </div>
              <div className={styles.reasonBlock}>
                <span className="sectionLabel">Why this result</span>
                <ul className="cleanList">
                  {person.reasons.map((reason) => <li key={reason}>✓ {reason}</li>)}
                </ul>
              </div>
              <div className={styles.resultActions}>
                <a className="secondary" href="/profile">View scientific profile</a>
                <a className="primaryButton" href={index === 0 ? "/introductions/new" : "/profile"}>Review introduction</a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
