import Link from "next/link";
import { ProductShell } from "@/components/shell/product-shell";
import styles from "./page.module.css";

const statusCards = [
  {
    label: "Scientific identity",
    value: "Source-aware",
    detail: "Profile ownership, provenance, and ORCID verification are available.",
    href: "/profile",
    tone: "mint",
  },
  {
    label: "Research discovery",
    value: "Explainable",
    detail: "Search by topic, method, geography, availability, and scientific intent.",
    href: "/discover",
    tone: "blue",
  },
  {
    label: "Opportunity intelligence",
    value: "Ready to enrich",
    detail: "The interface is in place for source-backed positions, fellowships, and grants.",
    href: "/opportunities",
    tone: "amber",
  },
  {
    label: "Introductions",
    value: "Controlled",
    detail: "Scientific outreach remains purpose-led and recipient-aware by design.",
    href: "/introductions/new",
    tone: "violet",
  },
] as const;

const nextActions = [
  { number: "01", title: "Strengthen your scientific identity", copy: "Add complete research focus, methods, affiliation, and verified identity signals.", href: "/profile", action: "Review identity" },
  { number: "02", title: "Run a focused researcher search", copy: "Describe the expertise or collaborator you need and inspect the reasons behind each result.", href: "/discover", action: "Open discovery" },
  { number: "03", title: "Evaluate high-value opportunities", copy: "Keep scientific relevance separate from formal eligibility before investing application time.", href: "/opportunities", action: "Review opportunities" },
];

const intelligenceRows = [
  { type: "Researcher", title: "Translational oncology collaborators", context: "Biomarkers · Europe · Open / selective", state: "Discovery ready" },
  { type: "Opportunity", title: "Postdoctoral and fellowship tracks", context: "Oncology · 90-day horizon", state: "Needs source sync" },
  { type: "Identity", title: "ORCID ownership verification", context: "Explicit provenance · No silent verification", state: "Live" },
];

export default function HomePage() {
  return (
    <ProductShell>
      <div className={styles.dashboard}>
        <header className={styles.pageHeader}>
          <div>
            <span className="eyebrow">Research workspace</span>
            <h1>Make the next scientific move with better context.</h1>
            <p>
              Studepartment turns fragmented research identities, opportunities, and collaboration signals into a small number of explainable actions.
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link className="secondary" href="/profile">Review identity</Link>
            <Link className="primaryButton" href="/discover">Start discovery</Link>
          </div>
        </header>

        <section className={styles.commandPanel}>
          <div className={styles.commandCopy}>
            <span className={styles.commandLabel}>Scientific intent</span>
            <h2>Who, what, or which opportunity are you trying to find?</h2>
            <p>Start with a scientific question. Structured filters and source confidence can narrow the result set after that.</p>
          </div>
          <Link className={styles.commandSearch} href="/discover">
            <span className={styles.searchIcon}>⌕</span>
            <span className={styles.searchPrompt}>e.g. pancreatic cancer imaging collaborators in Germany</span>
            <span className={styles.searchAction}>Search researchers</span>
          </Link>
          <div className={styles.commandSignals}>
            <span>Canonical scientific identity</span>
            <span>Explainable retrieval</span>
            <span>Source-aware confidence</span>
            <span>No popularity ranking</span>
          </div>
        </section>

        <section className={styles.statusGrid} aria-label="Platform capabilities">
          {statusCards.map((card) => (
            <Link className={styles.statusCard} data-tone={card.tone} href={card.href} key={card.label}>
              <div className={styles.statusTopline}>
                <span>{card.label}</span>
                <i aria-hidden="true" />
              </div>
              <strong>{card.value}</strong>
              <p>{card.detail}</p>
              <span className={styles.cardLink}>Open workspace →</span>
            </Link>
          ))}
        </section>

        <section className={styles.mainGrid}>
          <article className={styles.actionsPanel}>
            <div className={styles.panelHeader}>
              <div>
                <span className="sectionLabel">Next best actions</span>
                <h2>Move the foundation toward real research value.</h2>
              </div>
              <span className={styles.panelMeta}>3 recommended steps</span>
            </div>
            <div className={styles.actionList}>
              {nextActions.map((item) => (
                <div className={styles.actionRow} key={item.number}>
                  <span className={styles.actionNumber}>{item.number}</span>
                  <div className={styles.actionCopy}>
                    <strong>{item.title}</strong>
                    <p>{item.copy}</p>
                  </div>
                  <Link href={item.href}>{item.action} →</Link>
                </div>
              ))}
            </div>
          </article>

          <aside className={styles.signalPanel}>
            <span className="sectionLabel">Trust architecture</span>
            <h2>Evidence before confidence.</h2>
            <p className={styles.signalIntro}>Research recommendations should become more useful as source quality improves, not as engagement increases.</p>
            <div className={styles.signalStack}>
              <div><span>01</span><strong>Owned identity</strong><small>Authenticated user → canonical researcher profile</small></div>
              <div><span>02</span><strong>Source provenance</strong><small>Assertions, verified evidence, timestamps, and confidence</small></div>
              <div><span>03</span><strong>Explainable ranking</strong><small>Scientific relevance separated from popularity mechanics</small></div>
            </div>
            <Link href="/profile">Inspect scientific identity →</Link>
          </aside>
        </section>

        <section className={styles.intelligencePanel}>
          <div className={styles.panelHeader}>
            <div>
              <span className="sectionLabel">Current intelligence surfaces</span>
              <h2>What the platform can reason over now.</h2>
            </div>
            <Link href="/discover">Open discovery →</Link>
          </div>
          <div className={styles.tableHead}>
            <span>Surface</span><span>Intent</span><span>Context</span><span>Status</span>
          </div>
          <div className={styles.intelligenceRows}>
            {intelligenceRows.map((row) => (
              <div className={styles.intelligenceRow} key={row.title}>
                <span className={styles.typeBadge}>{row.type}</span>
                <strong>{row.title}</strong>
                <span>{row.context}</span>
                <span className={styles.stateBadge}>{row.state}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ProductShell>
  );
}
