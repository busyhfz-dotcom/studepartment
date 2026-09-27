import Link from "next/link";
import { ProductShell } from "@/components/shell/product-shell";
import { getCurrentUser } from "@/server/auth/current-user";
import { MarketingLanding } from "./marketing-landing";
import styles from "./page.module.css";

const intelligenceSurfaces = [
  {
    index: "01",
    label: "Scientific Identity",
    title: "Make your research context legible.",
    copy: "Canonical topics, methods, affiliations, ORCID ownership, publication evidence, and provenance form the context behind every recommendation.",
    href: "/profile",
    action: "Open identity",
    signal: "Evidence-aware",
  },
  {
    index: "02",
    label: "Scientific Discovery",
    title: "Find fit—not popularity.",
    copy: "Search researchers, laboratories, and institutions by scientific intent, exact methods, geography, and collaboration availability.",
    href: "/discover",
    action: "Explore discovery",
    signal: "Explainable retrieval",
  },
  {
    index: "03",
    label: "Opportunity Intelligence",
    title: "Protect your application time.",
    copy: "Evaluate source freshness, scientific relevance, published eligibility, deadlines, and institutional context before committing effort.",
    href: "/opportunities",
    action: "Review opportunities",
    signal: "Source-backed",
  },
  {
    index: "04",
    label: "Research Assistant",
    title: "Reason over evidence you can inspect.",
    copy: "Ask focused questions across your scientific context. Answers stay grounded in a request-specific Studepartment source ledger.",
    href: "/assistant",
    action: "Ask the assistant",
    signal: "Citation-grounded",
  },
] as const;

const decisionFlow = [
  {
    number: "01",
    title: "Establish context",
    copy: "Build a Scientific Identity that describes what you study, how you work, where you are, and what you are open to.",
    href: "/profile",
    action: "Review Scientific Identity",
  },
  {
    number: "02",
    title: "Interrogate the landscape",
    copy: "Search people, labs, institutions, and opportunities with reasoning that remains inspectable at the result level.",
    href: "/discover",
    action: "Start a discovery",
  },
  {
    number: "03",
    title: "Act with evidence",
    copy: "Save opportunities, inspect institutional fit, or request a controlled scientific introduction when the context is strong enough.",
    href: "/opportunities",
    action: "Open Opportunity Intelligence",
  },
];

const evidencePrinciples = [
  {
    kicker: "Identity",
    title: "Owned scientific context",
    copy: "Authentication resolves to a canonical researcher profile with explicit provenance.",
  },
  {
    kicker: "Retrieval",
    title: "Reasons before rank",
    copy: "Semantic signals augment structured evidence; they do not become an opaque reputation score.",
  },
  {
    kicker: "Action",
    title: "Control before outreach",
    copy: "Availability, recipient policy, cooldowns, and purpose protect scientific introductions from becoming social spam.",
  },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    return <MarketingLanding />;
  }

  return (
    <ProductShell>
      <div className={styles.dashboard}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className="eyebrow">Medical Research Intelligence</span>
            <h1>Research decisions, grounded in evidence.</h1>
            <p>
              Studepartment connects scientific identity, discovery, opportunities, institutions, and trusted introductions into one evidence-aware research workspace.
            </p>
            <div className={styles.heroActions}>
              <Link className="primaryButton" href="/discover">Start scientific discovery</Link>
              <Link className="secondary" href="/profile">Review Scientific Identity</Link>
            </div>
          </div>

          <aside className={styles.heroIndex} aria-label="Platform principles">
            <div className={styles.heroIndexTop}>
              <span>Research operating principles</span>
              <strong>04 / core</strong>
            </div>
            <div className={styles.principleList}>
              <div><span>01</span><strong>Canonical identity</strong><small>Context belongs to the researcher.</small></div>
              <div><span>02</span><strong>Source provenance</strong><small>Evidence stays attributable.</small></div>
              <div><span>03</span><strong>Explainable fit</strong><small>Reasons remain inspectable.</small></div>
              <div><span>04</span><strong>Controlled action</strong><small>Trust precedes outreach.</small></div>
            </div>
          </aside>
        </header>

        <section className={styles.commandDeck}>
          <div className={styles.commandLead}>
            <span className={styles.commandKicker}>Scientific intent</span>
            <h2>What are you trying to understand next?</h2>
            <p>Start with the research question. Add structure only when it improves precision.</p>
          </div>

          <Link className={styles.commandSearch} href="/discover">
            <span className={styles.searchGlyph} aria-hidden="true">
              <svg fill="none" viewBox="0 0 24 24">
                <circle cx="10.5" cy="10.5" r="6.2" />
                <path d="m15.2 15.2 4.6 4.6" />
              </svg>
            </span>
            <span className={styles.searchText}>
              <small>Search scientific intelligence</small>
              <strong>e.g. spatial transcriptomics collaborators in pancreatic cancer</strong>
            </span>
            <span className={styles.searchCommand}>Open Discovery <b>↗</b></span>
          </Link>

          <div className={styles.commandSignals}>
            <span><i /> Researchers</span>
            <span><i /> Laboratories</span>
            <span><i /> Institutions</span>
            <span><i /> Opportunities</span>
            <span><i /> Evidence Graph</span>
          </div>
        </section>

        <section className={styles.surfaceSection}>
          <div className={styles.sectionIntro}>
            <div>
              <span className="sectionLabel">Intelligence surfaces</span>
              <h2>One research context. Multiple ways to act on it.</h2>
            </div>
            <p>
              Each surface uses the same canonical scientific context while keeping provenance, relevance, eligibility, and user control distinct.
            </p>
          </div>

          <div className={styles.surfaceGrid}>
            {intelligenceSurfaces.map((surface) => (
              <Link className={styles.surfaceCard} href={surface.href} key={surface.index}>
                <div className={styles.surfaceTop}>
                  <span>{surface.index}</span>
                  <small>{surface.signal}</small>
                </div>
                <div>
                  <span className={styles.surfaceLabel}>{surface.label}</span>
                  <h3>{surface.title}</h3>
                  <p>{surface.copy}</p>
                </div>
                <strong className={styles.surfaceAction}>{surface.action} <span>↗</span></strong>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.workflowGrid}>
          <article className={styles.workflowPanel}>
            <div className={styles.panelHeading}>
              <div>
                <span className="sectionLabel">Decision workflow</span>
                <h2>Move from context to action without losing the evidence trail.</h2>
              </div>
              <span className={styles.panelMeta}>Three-stage research loop</span>
            </div>

            <div className={styles.workflowList}>
              {decisionFlow.map((item) => (
                <div className={styles.workflowRow} key={item.number}>
                  <span className={styles.workflowNumber}>{item.number}</span>
                  <div className={styles.workflowCopy}>
                    <strong>{item.title}</strong>
                    <p>{item.copy}</p>
                  </div>
                  <Link href={item.href}>{item.action} <span>↗</span></Link>
                </div>
              ))}
            </div>
          </article>

          <aside className={styles.evidencePanel}>
            <div className={styles.evidenceHeader}>
              <span className={styles.evidenceMonogram}>E</span>
              <div>
                <span className="sectionLabel">Evidence architecture</span>
                <h2>Confidence should have a source.</h2>
              </div>
            </div>
            <p className={styles.evidenceIntro}>
              Studepartment is designed to become more useful as evidence quality improves—not as engagement increases.
            </p>
            <div className={styles.evidenceStack}>
              {evidencePrinciples.map((item) => (
                <div key={item.kicker}>
                  <span>{item.kicker}</span>
                  <strong>{item.title}</strong>
                  <p>{item.copy}</p>
                </div>
              ))}
            </div>
            <Link href="/graph">Inspect the Scientific Evidence Graph <span>↗</span></Link>
          </aside>
        </section>

        <section className={styles.closingRail}>
          <div>
            <span className="sectionLabel">Private by default</span>
            <strong>Your feedback shapes your workspace—not a public reputation score.</strong>
          </div>
          <div>
            <span className="sectionLabel">Scientific fit ≠ eligibility</span>
            <strong>Relevance and formal requirements stay deliberately separate.</strong>
          </div>
          <Link href="/settings/privacy">Privacy & data controls <span>↗</span></Link>
        </section>
      </div>
    </ProductShell>
  );
}
