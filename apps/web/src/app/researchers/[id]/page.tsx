import Link from "next/link";
import { notFound } from "next/navigation";
import { researcherPreviews } from "@/lib/scientific-data";
import styles from "./page.module.css";

export function generateStaticParams() {
  return researcherPreviews.map((researcher) => ({ id: researcher.id }));
}

export default async function ResearcherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const researcher = researcherPreviews.find((item) => item.id === id);

  if (!researcher) notFound();

  return (
    <main className={`shell ${styles.shell}`}>
      <Link className="backLink" href="/discover">← Back to discovery</Link>

      <header className={styles.header}>
        <div>
          <span className="eyebrow">Scientific identity</span>
          <h1>{researcher.name}</h1>
          <p className={styles.role}>{researcher.title}</p>
          <p className={styles.meta}>{researcher.institution} · {researcher.location}</p>
        </div>
        <div className={styles.trustCard}>
          <span className="sectionLabel">Trust signals</span>
          <strong>{researcher.verified ? "Verified scientific identity" : "Public scientific identity"}</strong>
          <p>Identity confidence is based on source-backed scientific data rather than social activity.</p>
        </div>
      </header>

      <section className={styles.grid}>
        <article className={styles.panel}>
          <span className="sectionLabel">Research focus</span>
          <div className={styles.tags}>
            {researcher.topics.map((topic) => <span key={topic}>{topic}</span>)}
          </div>
        </article>

        <article className={styles.panel}>
          <span className="sectionLabel">Methods</span>
          <ul className="cleanList">
            {researcher.methods.map((method) => <li key={method}>{method}</li>)}
          </ul>
        </article>

        <article className={styles.panel}>
          <span className="sectionLabel">Currently open to</span>
          <ul className="cleanList">
            {researcher.openTo.map((goal) => <li key={goal}>✓ {goal}</li>)}
          </ul>
        </article>
      </section>

      <section className={styles.matchPanel}>
        <div>
          <span className="sectionLabel">Why this researcher appeared</span>
          <h2>{researcher.match.level} scientific alignment</h2>
          <p>We show the underlying reasons instead of turning relevance into a public researcher score.</p>
        </div>
        <ul>
          {researcher.match.reasons.map((reason) => <li key={reason}>✓ {reason}</li>)}
        </ul>
      </section>

      <section className={styles.actionBar}>
        <div>
          <strong>Interested in connecting?</strong>
          <p>Review the purpose and context before sending a controlled scientific introduction.</p>
        </div>
        <Link className="primaryButton" href={`/introductions/new?researcher=${researcher.id}`}>Request scientific introduction</Link>
      </section>
    </main>
  );
}
