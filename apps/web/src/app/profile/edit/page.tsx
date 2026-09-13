import styles from "./page.module.css";

const fields = [
  { label: "Full name", value: "Dr. Sarah Williams" },
  { label: "Headline", value: "Clinical Researcher · Translational Oncology" },
  { label: "Institution", value: "University of Oxford" },
  { label: "Career stage", value: "Early-career researcher" },
  { label: "Location", value: "Oxford, UK" },
];

export default function EditProfilePage() {
  return (
    <main className="shell onboardingShell">
      <a className="backLink" href="/profile">← Back to profile</a>
      <header className="onboardingHeader">
        <span className="eyebrow">Edit scientific identity</span>
        <h1>Keep the profile useful, current, and intentionally small.</h1>
        <p className="lede">Only information that affects trust, discovery, matching, or connection quality belongs here.</p>
      </header>

      <form className={styles.editorCard}>
        <section className={styles.editorSection}>
          <span className="sectionLabel">Identity</span>
          <div className={styles.editorGrid}>
            {fields.map((field) => (
              <label className={styles.fieldGroup} key={field.label}>
                <span>{field.label}</span>
                <input defaultValue={field.value} />
              </label>
            ))}
          </div>
        </section>

        <section className={styles.editorSection}>
          <span className="sectionLabel">Research summary</span>
          <label className={styles.fieldGroup}>
            <span>Summary</span>
            <textarea defaultValue="Researcher focused on translational oncology, immune-based therapies, and clinically actionable biomarkers." rows={5} />
          </label>
        </section>

        <section className={`${styles.editorSection} ${styles.editorSplit}`}>
          <div>
            <span className="sectionLabel">Availability</span>
            <select defaultValue="SELECTIVE">
              <option value="OPEN">Open</option>
              <option value="SELECTIVE">Selective</option>
              <option value="QUIET">Quiet mode</option>
              <option value="CLOSED">Not accepting requests</option>
            </select>
          </div>
          <div>
            <span className="sectionLabel">ORCID</span>
            <div className={styles.sourceBox}>
              <strong>0000-0002-1825-0097</strong>
              <span>Connected source · editable through sync settings</span>
            </div>
          </div>
        </section>

        <footer className={styles.editorActions}>
          <span>Changes that affect matching should be versioned and auditable.</span>
          <button className="primaryButton" type="submit">Save changes</button>
        </footer>
      </form>
    </main>
  );
}
