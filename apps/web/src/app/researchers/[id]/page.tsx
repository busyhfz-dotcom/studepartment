import Link from "next/link";
import { notFound } from "next/navigation";
import { IdentityAvatar } from "@/components/identity/identity-avatar";
import { ProfessionalProfileSections } from "@/components/scientific/professional-profile-sections";
import { ProductShell } from "@/components/shell/product-shell";
import { getPublicResearcherProfile } from "@/server/researchers/public-profile";
import styles from "./page.module.css";

function evidenceLabel(value: "MANUAL_ASSERTED" | "ORCID_ASSERTED" | "PUBMED_CORROBORATED") {
  if (value === "PUBMED_CORROBORATED") return "PubMed corroborated";
  if (value === "ORCID_ASSERTED") return "ORCID asserted";
  return "Manual assertion";
}

export default async function ResearcherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const researcher = await getPublicResearcherProfile(id);
  if (!researcher) notFound();

  return (
    <ProductShell>
      <div className={styles.shell}>
        <Link className="backLink" href="/discover">← Back to scientific discovery</Link>

        <header className={styles.header}>
          <div className={styles.identityBlock}>
            <IdentityAvatar name={researcher.fullName} src={researcher.imageUrl} kind="person" size="large" />
            <div>
              <span className="eyebrow">Scientific identity</span>
              <h1>{researcher.fullName}</h1>
              <p className={styles.role}>{researcher.headline}</p>
              <p className={styles.meta}>{researcher.institution} · {researcher.location}</p>
              {researcher.bio ? <p className={styles.bio}>{researcher.bio}</p> : null}
            </div>
          </div>
          <div className={styles.trustCard}>
            <span className="sectionLabel">Evidence & trust</span>
            <strong>{researcher.verified ? "Verified scientific identity" : "Canonical public identity"}</strong>
            <p>Trust signals reflect identity, organization, ORCID, and publication evidence—not social activity or popularity.</p>
            <div className={styles.trustGrid}>
              {researcher.trustSignals.map((signal) => (
                <span className={signal.verified ? styles.trustOn : styles.trustOff} key={signal.label}>
                  {signal.verified ? "✓" : "○"} {signal.label}
                </span>
              ))}
            </div>
          </div>
        </header>

        <section className={styles.grid}>
          <article className={styles.panel}>
            <span className="sectionLabel">Research focus</span>
            <div className={styles.tags}>
              {researcher.topics.length
                ? researcher.topics.map((topic) => <span key={topic}>{topic}</span>)
                : <span className={styles.emptyTag}>No canonical topics yet</span>}
            </div>
          </article>

          <article className={styles.panel}>
            <span className="sectionLabel">Methods</span>
            <ul className="cleanList">
              {researcher.methods.length
                ? researcher.methods.map((method) => <li key={method}>{method}</li>)
                : <li>No canonical methods yet</li>}
            </ul>
          </article>

          <article className={styles.panel}>
            <span className="sectionLabel">Collaboration posture</span>
            <div className={styles.availability}>{researcher.availability} availability</div>
            <ul className="cleanList">
              {researcher.collaborationGoals.length
                ? researcher.collaborationGoals.map((goal) => <li key={goal}>✓ {goal}</li>)
                : <li>No active collaboration goals published</li>}
            </ul>
          </article>
        </section>

        <ProfessionalProfileSections details={researcher.profileDetails ?? undefined} />

        <section className={styles.publicationPanel}>
          <div className={styles.publicationHeading}>
            <div>
              <span className="sectionLabel">Publication evidence</span>
              <h2>Recent source-backed outputs</h2>
            </div>
            <Link href={"/graph?researcher=" + researcher.id}>Open evidence graph ↗</Link>
          </div>

          {researcher.publications.length ? (
            <div className={styles.publicationList}>
              {researcher.publications.map((publication) => (
                <article className={styles.publicationCard} key={publication.id}>
                  <div className={styles.publicationMeta}>
                    <span>{evidenceLabel(publication.evidenceLevel)}</span>
                    <span>{publication.year ?? "Date unavailable"}</span>
                  </div>
                  <h3>{publication.title}</h3>
                  <p>{publication.journal ?? "Journal not published"}</p>
                  <div className={styles.publicationIds}>
                    {publication.pmid ? <span>PMID {publication.pmid}</span> : null}
                    {publication.doi ? <span>DOI {publication.doi}</span> : null}
                  </div>
                  {publication.sourceUrl ? <a href={publication.sourceUrl} rel="noreferrer" target="_blank">Open source ↗</a> : null}
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyPublications}>No active publication evidence is available on this scientific identity yet.</div>
          )}
        </section>

        <section className={styles.graphPanel}>
          <div>
            <span className="sectionLabel">Evidence neighborhood</span>
            <h2>Inspect the scientific relationships behind this identity.</h2>
            <p>The Evidence Graph derives relationships from canonical publications, topics, methods, laboratories, institutions, and current opportunities.</p>
          </div>
          <Link className={styles.graphButton} href={"/graph?researcher=" + researcher.id}>Explore evidence graph</Link>
        </section>

        <section className={styles.actionBar}>
          <div>
            <strong>Is the scientific context strong enough to connect?</strong>
            <p>Review the purpose and context before sending a controlled scientific introduction.</p>
          </div>
          <div className={styles.actionButtons}>
            <Link className="secondary" href={"/graph?researcher=" + researcher.id}>Evidence graph</Link>
            <Link className="secondary" href={"/assistant?researcher=" + researcher.id}>Ask Research Assistant</Link>
            <Link className="primaryButton" href={"/introductions/new?researcher=" + researcher.id}>Request scientific introduction</Link>
          </div>
        </section>
      </div>
    </ProductShell>
  );
}
