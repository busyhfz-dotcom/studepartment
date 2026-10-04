import Link from "next/link";
import type { PublicOpportunityTicker } from "@/server/opportunities/public-ticker";
import { OpportunityTicker, PlatformTabs, MobileNav, Reveal } from "./marketing-landing-client";
import styles from "./marketing-landing.module.css";

/** Public platform overview, retaining the original copy and live opportunity feed. */

const platformSurfaces = [
  {
    key: "identity",
    number: "01 / Scientific Identity",
    title: "Let your work speak clearly.",
    copy: "Bring together research topics, methods, affiliations, ORCID ownership and publication evidence in a profile you control.",
    action: "Explore identity",
    href: "/profile",
    preview: "A scientific profile with provenance.",
    rows: [
      ["Research topics", "Canonical context"],
      ["Methods & affiliations", "Structured evidence"],
      ["ORCID & publications", "Attributable sources"],
    ],
  },
  {
    key: "discovery",
    number: "02 / Scientific Discovery",
    title: "Find fit with a reason.",
    copy: "Search researchers, laboratories and institutions by scientific intent, methods, geography and collaboration availability.",
    action: "Explore discovery",
    href: "/discover",
    preview: "Find collaborators by what they study.",
    rows: [
      ["Scientific intent", "A focused question"],
      ["Relevant people & labs", "Explainable results"],
      ["Source context", "Inspect the evidence"],
    ],
  },
  {
    key: "institutions",
    number: "03 / Institution Directory",
    title: "See who is behind the work.",
    copy: "Browse verified research institutions and their laboratories — including newly indexed cancer research centers — before you decide where to apply.",
    action: "Explore institutions",
    href: "/discover/institutions",
    preview: "An institution directory with lab-level detail.",
    rows: [
      ["Institutions & labs", "Directory, not a leaderboard"],
      ["Focus areas", "Matched to your field"],
      ["Provenance", "Sourced and dated"],
    ],
  },
  {
    key: "opportunities",
    number: "04 / Opportunity Intelligence",
    title: "See beyond the headline.",
    copy: "Review positions and grants alongside source freshness, scientific relevance, published eligibility and deadlines.",
    action: "Browse opportunities",
    href: "/opportunities",
    preview: "A clearer decision before you apply.",
    rows: [
      ["Published deadline", "Timing matters"],
      ["Scientific relevance", "Why it fits"],
      ["Formal eligibility", "Check requirements"],
    ],
  },
  {
    key: "assistant",
    number: "05 / Research Assistant",
    title: "Ask with evidence in view.",
    copy: "Explore focused questions across your scientific context. Answers are designed to point back to the sources behind them.",
    action: "Explore assistant",
    href: "/assistant",
    preview: "A question with an inspectable source trail.",
    rows: [
      ["Your research question", "Focused prompt"],
      ["Source ledger", "Grounded response"],
      ["Next step", "Researcher decides"],
    ],
  },
] as const;

export function MarketingLanding({ ticker }: { ticker: PublicOpportunityTicker }) {
  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <div className={styles.container}>
          <div className={styles.topInner}>
            <Link className={styles.brand} href="/">
              <span className={styles.mark}>S</span>
              <span>
                studepartment<b>.</b>
              </span>
            </Link>
            <MobileNav
              links={[
                { href: "#platform", label: "Platform" },
                { href: "#principles", label: "Our approach" },
                { href: "#pathways", label: "Who it's for" },
              ]}
            />
            <div className={styles.navActions}>
              <Link href="/auth/sign-in">Sign in</Link>
              <Link className={styles.join} href="/auth/sign-up">
                Join free ↗
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main id="top">
        <section className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.heroTop}>
              <i /> Medical research intelligence · worldwide
            </div>
            <div className={styles.heroGrid}>
              <div className={styles.heroCopy}>
                <h1>
                  Good research starts with the <em>right connection.</em>
                </h1>
                <p>
                  One place to understand your scientific context, find relevant people and opportunities, and take
                  the next step with evidence you can inspect.
                </p>
                <div className={styles.heroActions}>
                  <a className={styles.primary} href="#platform">
                    Explore the platform <span>↗</span>
                  </a>
                  <Link className={styles.secondary} href="/start">
                    Browse positions &amp; grants ↓
                  </Link>
                </div>
              </div>

              <OpportunityTicker ticker={ticker} />
            </div>
            <div className={styles.heroBottom}>
              <span>Researcher-controlled · source-aware · private by default</span>
              <span>Explore the platform ↓</span>
            </div>
          </div>
        </section>

        <section className={styles.intro} id="platform">
          <div className={styles.container}>
            <Reveal className={styles.introHead}>
              <div>
                <span className={styles.eyebrow}>The platform</span>
                <h2>
                  One research context.
                  <br />
                  More ways to move forward.
                </h2>
              </div>
              <p>
                Studepartment connects your scientific identity to discovery, opportunities and evidence-led
                decisions. Explore each part below.
              </p>
            </Reveal>
            <PlatformTabs surfaces={platformSurfaces} />
          </div>
        </section>

        <section className={styles.proof} id="principles">
          <div className={`${styles.container} ${styles.proofGrid}`}>
            <Reveal as="article" className={styles.proofItem}>
              <span className={styles.index}>01 / Provenance</span>
              <h3>Know where it came from.</h3>
              <p>Sources, dates and institutional context should remain visible when you evaluate a research lead.</p>
            </Reveal>
            <Reveal as="article" className={styles.proofItem} delay={80}>
              <span className={styles.index}>02 / Fit</span>
              <h3>Reasons before rank.</h3>
              <p>Scientific relevance and formal eligibility are different questions. Both deserve a clear answer.</p>
            </Reveal>
            <Reveal as="article" className={styles.proofItem} delay={160}>
              <span className={styles.index}>03 / Control</span>
              <h3>Your context stays yours.</h3>
              <p>
                Research interests and private feedback support your decisions without becoming a public score.
              </p>
            </Reveal>
          </div>
        </section>

        <section className={styles.pathways} id="pathways">
          <div className={styles.container}>
            <Reveal className={styles.pathHead}>
              <div>
                <span className={styles.eyebrow}>A place for each side of research</span>
                <h2>Find a way in that fits.</h2>
              </div>
              <p>
                The public entry flow keeps opportunity browsing simple. Institutions have a distinct path to share
                their openings.
              </p>
            </Reveal>
            <div className={styles.pathGrid}>
              <Reveal as="div">
                <Link className={styles.pathCard} href="/start">
                  <div className={styles.topline}>
                    <span>For researchers</span>
                    <span>↗</span>
                  </div>
                  <div>
                    <h3>Explore positions &amp; funding</h3>
                    <p>Browse publicly first; create an account for personal tracking and research tools.</p>
                  </div>
                  <span className={styles.action}>
                    Start browsing <span>→</span>
                  </span>
                </Link>
              </Reveal>
              <Reveal as="div" delay={80}>
                <Link
                  className={styles.pathCard}
                  href="/auth/sign-up?callbackUrl=%2Fonboarding%2Forganization"
                >
                  <div className={styles.topline}>
                    <span>For labs &amp; institutions</span>
                    <span>↗</span>
                  </div>
                  <div>
                    <h3>Share an opportunity</h3>
                    <p>Build an institutional profile and bring a role or funding call to relevant researchers.</p>
                  </div>
                  <span className={styles.action}>
                    Create an institutional profile <span>→</span>
                  </span>
                </Link>
              </Reveal>
            </div>
          </div>
        </section>

        <section className={styles.closing}>
          <div className={`${styles.container} ${styles.closingGrid}`}>
            <div>
              <span className={styles.eyebrow}>Begin with your research</span>
              <h2>
                Make the next move <em>matter.</em>
              </h2>
              <p>Find context, inspect evidence, and decide on your own terms.</p>
            </div>
            <Link href="/start">
              Explore opportunities <span>↗</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className={`${styles.footer} ${styles.container}`}>
        <Link className={styles.brand} href="/">
          <span className={styles.mark}>S</span>
          <span>
            studepartment<b>.</b>
          </span>
        </Link>
        <span>Medical research, worldwide.</span>
        <div className={styles.footerLinks}>
          <a href="#platform">Platform</a>
          <a href="#principles">Our approach</a>
          <Link href="/auth/sign-in">Sign in to your workspace</Link>
        </div>
      </footer>
    </div>
  );
}
