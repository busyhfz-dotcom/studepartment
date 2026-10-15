import Link from "next/link";
import type { PublicOpportunityTicker } from "@/server/opportunities/public-ticker";
import { OpportunityTicker, PlatformTabs, MobileNav, Reveal } from "./marketing-landing-client";
import styles from "./marketing-landing.module.css";
import { BrandSymbol, ResearchPreview } from "@/components/design/research-art";
import { ScientificBackdrop } from "@/components/design/scientific-backdrop";
import { FeatureAvailability } from "@/components/feature-availability";

/** Public platform overview with the live opportunity feed. */

const platformSurfaces = [
  {
    key: "identity",
    number: "01 / Scientific Identity",
    title: "A profile that reflects your actual work.",
    copy: "Your topics, methods, affiliations and publications in one place, linked to ORCID if you choose. You decide who can see it.",
    action: "Explore identity",
    href: "/profile",
    preview: "Every detail linked to its source.",
    rows: [
      ["Research topics", "What you study"],
      ["Methods & affiliations", "How and where you work"],
      ["ORCID & publications", "Linked to the record"],
    ],
  },
  {
    key: "discovery",
    number: "02 / Scientific Discovery",
    title: "Find people by what they study.",
    copy: "Search researchers, labs and institutions by topic, method, country and openness to collaboration. Each result tells you why it matched.",
    action: "Explore discovery",
    href: "/discover",
    preview: "Results that explain themselves.",
    rows: [
      ["Your question", "Start from the science"],
      ["Researchers & labs", "Matched on topic and method"],
      ["Sources", "Check the evidence yourself"],
    ],
  },
  {
    key: "institutions",
    number: "03 / Institution Directory",
    title: "See who is behind the work.",
    copy: "Browse research institutions and their labs, including newly added cancer research centers, before you decide where to apply.",
    action: "Explore institutions",
    href: "/discover/institutions",
    preview: "An institution directory with lab-level detail.",
    rows: [
      ["Institutions & labs", "A directory, not a ranking"],
      ["Focus areas", "Matched to your field"],
      ["Sources", "Where each record came from"],
    ],
  },
  {
    key: "opportunities",
    number: "04 / Opportunity Intelligence",
    title: "See beyond the headline.",
    copy: "See each position and grant with its deadline, eligibility, relevance to your work and the date its source was last checked.",
    action: "Browse opportunities",
    href: "/opportunities",
    preview: "A clearer decision before you apply.",
    rows: [
      ["Deadline", "Taken from the source"],
      ["Relevance", "Why it fits your work"],
      ["Eligibility", "Who can apply"],
    ],
  },
  {
    key: "assistant",
    number: "05 / Research Assistant",
    title: "Ask questions. See the sources.",
    copy: "Ask about fit, funders or institutions. Answers cite the Provenant records they rely on, so you can check them.",
    action: "Explore assistant",
    href: "/assistant",
    preview: "Every answer shows its sources.",
    rows: [
      ["Your question", "In plain language"],
      ["Sources", "Cited in the answer"],
      ["Next step", "Always your decision"],
    ],
  },
] as const;

export function MarketingLanding({ ticker }: { ticker: PublicOpportunityTicker }) {
  return (
    <div className={styles.page}>
      <ScientificBackdrop className={styles.motionLayer} />
      <header className={styles.top}>
        <div className={styles.container}>
          <div className={styles.topInner}>
            <Link className={styles.brand} href="/start" aria-label="Provenant home">
              <span className={styles.mark}><BrandSymbol /></span>
              <span>
                provenant<b>.</b>
              </span>
            </Link>
            <MobileNav
              links={[
                { href: "#platform", label: "Platform" },
                { href: "#principles", label: "Our approach" },
                { href: "#pathways", label: "Who it's for" },
                { href: "/auth/sign-in", label: "Sign in" },
                { href: "/auth/sign-up", label: "Create account" },
              ]}
            />
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
                  Every opportunity, <em>with its source.</em>
                </h1>
                <p>
                  Positions, funding and collaborators for medical researchers, in one place. Every listing shows where
                  it came from and when it was last checked, so you can judge what is worth your time.
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

            </div>
            <div className={styles.heroBottom}>
              <span>Sourced listings · private by default · free to browse</span>
              <span>Explore the platform ↓</span>
            </div>
            <ResearchPreview />
            <OpportunityTicker ticker={ticker} />
            <FeatureAvailability />
          </div>
        </section>

        <section className={styles.intro} id="platform">
          <div className={styles.container}>
            <Reveal className={styles.introHead}>
              <div>
                <span className={styles.eyebrow}>The platform</span>
                <h2>
                  One profile.
                  <br />
                  Five ways to put it to work.
                </h2>
              </div>
              <p>
                Describe what you study and how you work once. Search, opportunities and the research assistant all
                build on that same profile.
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
              <p>Every listing shows its source, who published it and when it was last checked.</p>
            </Reveal>
            <Reveal as="article" className={styles.proofItem} delay={80}>
              <span className={styles.index}>02 / Fit</span>
              <h3>Reasons before rank.</h3>
              <p>Being a good fit and being eligible to apply are different questions. We answer them separately.</p>
            </Reveal>
            <Reveal as="article" className={styles.proofItem} delay={160}>
              <span className={styles.index}>03 / Control</span>
              <h3>Your data stays yours.</h3>
              <p>
                Your interests and feedback shape your own results. They are never turned into a public score.
              </p>
            </Reveal>
          </div>
        </section>

        <section className={styles.pathways} id="pathways">
          <div className={styles.container}>
            <Reveal className={styles.pathHead}>
              <div>
                <span className={styles.eyebrow}>For researchers and institutions</span>
                <h2>Two ways in.</h2>
              </div>
              <p>
                Researchers can browse openings without an account. Labs and institutions have their own route for
                posting roles and funding calls.
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
                    <p>Browse without signing up. Create a free account when you want to save opportunities and track deadlines.</p>
                  </div>
                  <span className={styles.action}>
                    Start browsing <span>→</span>
                  </span>
                </Link>
              </Reveal>
              <Reveal as="div" delay={80}>
                <Link
                  className={styles.pathCard}
                  href="/auth/sign-up?kind=institution"
                >
                  <div className={styles.topline}>
                    <span>For labs &amp; institutions</span>
                    <span>↗</span>
                  </div>
                  <div>
                    <h3>Post an opportunity</h3>
                    <p>Set up an institutional profile and put your role or funding call in front of researchers who fit it.</p>
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
              <span className={styles.eyebrow}>Get started</span>
              <h2>
                Find your next <em>opportunity.</em>
              </h2>
              <p>Free to browse. You only need an account when you want to save something.</p>
            </div>
            <Link href="/start">
              Explore opportunities <span>↗</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className={`${styles.footer} ${styles.container}`}>
        <Link className={styles.brand} href="/start">
          <span className={styles.mark}><BrandSymbol /></span>
          <span>
            provenant<b>.</b>
          </span>
        </Link>
        <span>Medical research, worldwide.</span>
        <div className={styles.footerLinks}>
          <a href="#platform">Platform</a>
          <a href="#principles">Our approach</a>
          <Link href="/auth/sign-in">Sign in to your workspace</Link>
          <Link href="/sources">Data sources</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
