import Link from "next/link";
import { ProductShell } from "@/components/shell/product-shell";
import { getCurrentUser } from "@/server/auth/current-user";
import { StartFlow } from "./start/start-flow-client";
import styles from "./page.module.css";
import { ResearchOrbit } from "@/components/design/research-art";

const intelligenceSurfaces = [
  {
    index: "01",
    label: "Scientific Identity",
    title: "Describe your work precisely.",
    copy: "Topics, methods, affiliations, ORCID and publications. Every match and suggestion Provenant makes starts here.",
    href: "/profile",
    action: "Open identity",
    signal: "Your profile",
  },
  {
    index: "02",
    label: "Scientific Discovery",
    title: "Find people by fit, not popularity.",
    copy: "Search researchers, labs and institutions by topic, method, country and openness to collaboration.",
    href: "/discover",
    action: "Explore discovery",
    signal: "Explained matches",
  },
  {
    index: "03",
    label: "Institution Directory",
    title: "See who is behind the work.",
    copy: "Browse research institutions and their labs, including newly added cancer research centers, each with its source.",
    href: "/discover/institutions",
    action: "Browse institutions",
    signal: "Verified directory",
  },
  {
    index: "04",
    label: "Opportunity Intelligence",
    title: "Protect your application time.",
    copy: "Check the deadline, eligibility, relevance and source date before you spend time on an application.",
    href: "/opportunities",
    action: "Review opportunities",
    signal: "Sourced",
  },
  {
    index: "05",
    label: "Research Assistant",
    title: "Ask, and see the sources.",
    copy: "Ask focused questions about your field. Answers cite the Provenant records they rely on.",
    href: "/assistant",
    action: "Ask the assistant",
    signal: "Cited answers",
  },
] as const;

const decisionFlow = [
  {
    number: "01",
    title: "Set up your profile",
    copy: "Say what you study, how you work, where you are and what kinds of collaboration you are open to.",
    href: "/profile",
    action: "Review Scientific Identity",
  },
  {
    number: "02",
    title: "Search",
    copy: "Look for people, labs, institutions and opportunities. Every result explains why it appeared.",
    href: "/discover",
    action: "Start searching",
  },
  {
    number: "03",
    title: "Act",
    copy: "Save opportunities, compare institutions or request an introduction when the fit is strong.",
    href: "/opportunities",
    action: "Open Opportunity Intelligence",
  },
];

const evidencePrinciples = [
  {
    kicker: "Identity",
    title: "Your profile, your control",
    copy: "Only you can edit your profile, and imported details keep a record of their source.",
  },
  {
    kicker: "Retrieval",
    title: "Reasons before rank",
    copy: "Search understands meaning as well as keywords, but never turns researchers into a hidden reputation score.",
  },
  {
    kicker: "Action",
    title: "Considerate outreach",
    copy: "Recipient settings, waiting periods and a stated purpose keep introductions from turning into spam.",
  },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    return <StartFlow />;
  }

  const isInstitution = user.accountKind === "INSTITUTION";
  const identityHref = isInstitution ? "/organization/profile" : "/profile";
  const surfaces = isInstitution
    ? intelligenceSurfaces.map((surface) =>
        surface.href === "/profile"
          ? {
              ...surface,
              label: "Institutional Identity",
              title: "Present your institution on the record.",
              copy: "Your organization record, your postings and your verification status, together in one institutional profile.",
              href: "/organization/profile",
              action: "Open institutional profile",
            }
          : surface,
      )
    : intelligenceSurfaces;

  return (
    <ProductShell accountKind={user.accountKind === "INSTITUTION" ? "institution" : "individual"}>
      <div className={styles.dashboard}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className="eyebrow">Medical Research Intelligence</span>
            <h1>Research decisions,<br /><em>grounded in evidence.</em></h1>
            <p>
              Your profile, searches, saved opportunities and introductions in one workspace, with the source behind every result.
            </p>
            <div className={styles.heroActions}>
              <Link className="primaryButton" href="/discover">Search researchers</Link>
              <Link className="secondary" href={identityHref}>{isInstitution ? "Review Institutional Profile" : "Review Scientific Identity"}</Link>
            </div>
          </div>

          <aside className={styles.heroIndex} aria-label="How Provenant works">
            <ResearchOrbit />
            <div className={styles.heroIndexTop}>
              <span>How Provenant works</span>
              <strong>04 / core</strong>
            </div>
            <div className={styles.principleList}>
              <div><span>01</span><strong>Your profile</strong><small>You control what it says.</small></div>
              <div><span>02</span><strong>Sourced data</strong><small>Every record shows its origin.</small></div>
              <div><span>03</span><strong>Clear matches</strong><small>Each result says why.</small></div>
              <div><span>04</span><strong>Respectful outreach</strong><small>Introductions follow each person&apos;s rules.</small></div>
            </div>
          </aside>
        </header>

        <section className={styles.commandDeck}>
          <div className={styles.commandLead}>
            <span className={styles.commandKicker}>Search</span>
            <h2>What are you looking for?</h2>
            <p>Describe it the way you would to a colleague. Add filters only if you need them.</p>
          </div>

          <Link className={styles.commandSearch} href="/discover">
            <span className={styles.searchGlyph} aria-hidden="true">
              <svg fill="none" viewBox="0 0 24 24">
                <circle cx="10.5" cy="10.5" r="6.2" />
                <path d="m15.2 15.2 4.6 4.6" />
              </svg>
            </span>
            <span className={styles.searchText}>
              <small>Search Provenant</small>
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
              <span className="sectionLabel">Your workspace</span>
              <h2>One profile, five tools.</h2>
            </div>
            <p>
              Every tool works from the same profile, and keeps sources, relevance, eligibility and your privacy settings separate.
            </p>
          </div>

          <div className={styles.surfaceGrid}>
            {surfaces.map((surface) => (
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
                <span className="sectionLabel">How it works</span>
                <h2>From profile to application, with the sources in view.</h2>
              </div>
              <span className={styles.panelMeta}>Three steps</span>
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
                <span className="sectionLabel">Our principles</span>
                <h2>Confidence should have a source.</h2>
              </div>
            </div>
            <p className={styles.evidenceIntro}>
              Provenant should get more useful as its sources improve, not as you spend more time on it.
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
            <Link href="/graph">Open the Evidence Graph <span>↗</span></Link>
          </aside>
        </section>

        <section className={styles.closingRail}>
          <div>
            <span className="sectionLabel">Private by default</span>
            <strong>Your feedback improves your own results. It is never made public.</strong>
          </div>
          <div>
            <span className="sectionLabel">Fit vs. eligibility</span>
            <strong>We show relevance and formal requirements separately, on purpose.</strong>
          </div>
          <Link href="/settings/privacy">Privacy & data controls <span>↗</span></Link>
        </section>
      </div>
    </ProductShell>
  );
}
