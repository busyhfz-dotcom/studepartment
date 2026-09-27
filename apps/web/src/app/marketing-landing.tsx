import Link from "next/link";
import styles from "./marketing-landing.module.css";

const howItWorks = [
  {
    number: "01",
    title: "Establish context",
    copy: "Build a Scientific Identity that describes what you study, how you work, where you are, and what you are open to — owned by you, not inferred from social signals.",
  },
  {
    number: "02",
    title: "Interrogate the landscape",
    copy: "Search researchers, laboratories, institutions, and opportunities with reasoning that stays inspectable at the result level, not a hidden ranking score.",
  },
  {
    number: "03",
    title: "Act with evidence",
    copy: "Save opportunities, inspect institutional fit, or request a controlled scientific introduction only once the context genuinely supports it.",
  },
];

const principles = [
  {
    kicker: "Identity",
    title: "Owned scientific context",
    copy: "Authentication resolves to a canonical researcher profile with explicit provenance.",
  },
  {
    kicker: "Retrieval",
    title: "Reasons before rank",
    copy: "Semantic signals augment structured evidence; they never become an opaque reputation score.",
  },
  {
    kicker: "Outreach",
    title: "Control before contact",
    copy: "Availability, recipient policy, cooldowns, and stated purpose keep introductions from becoming social spam.",
  },
  {
    kicker: "Privacy",
    title: "Private by default",
    copy: "Nothing you enter becomes a public profile, a leaderboard, or a feed. You decide what is visible, to whom.",
  },
];

function BrandMark() {
  return (
    <span className={styles.brandMark} aria-hidden="true">
      <svg fill="none" viewBox="0 0 32 32">
        <path d="M9.2 8.8h8.4a5.2 5.2 0 0 1 0 10.4h-3.2a4.6 4.6 0 0 0 0 9.2h8.4" />
        <circle cx="9.2" cy="8.8" r="2.2" />
        <circle cx="22.8" cy="23.8" r="2.2" />
      </svg>
    </span>
  );
}

export function MarketingLanding() {
  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <Link className={styles.brand} href="/">
          <BrandMark />
          <span>
            <strong>Studepartment</strong>
            <small>Medical Research Intelligence</small>
          </span>
        </Link>
        <div className={styles.navActions}>
          <Link className="secondary" href="/auth/sign-in">Sign in</Link>
          <Link className="primaryButton" href="/auth/sign-up">Get started</Link>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className="eyebrow">Medical Research Intelligence</span>
          <h1>Research decisions, grounded in evidence.</h1>
          <p>
            Studepartment connects your scientific identity, discovery, opportunities, and trusted introductions
            into one evidence-aware workspace — built to earn trust through explainability, not engagement.
          </p>
          <div className={styles.heroActions}>
            <Link className="primaryButton" href="/auth/sign-up">Create your scientific identity</Link>
            <Link className="secondary" href="/auth/sign-in">Sign in</Link>
          </div>
          <p className={styles.heroNote}>
            Currently onboarding research groups directly — no public rankings, no follower counts, no vanity metrics.
          </p>
        </div>

        <aside className={styles.heroPanel} aria-label="Platform principles">
          <div className={styles.heroPanelTop}>
            <span>Operating principles</span>
            <span>04 / core</span>
          </div>
          <div className={styles.heroPanelList}>
            <div><span>01</span><div><strong>Canonical identity</strong><small>Context belongs to the researcher.</small></div></div>
            <div><span>02</span><div><strong>Source provenance</strong><small>Evidence stays attributable.</small></div></div>
            <div><span>03</span><div><strong>Explainable fit</strong><small>Reasons remain inspectable.</small></div></div>
            <div><span>04</span><div><strong>Controlled action</strong><small>Trust precedes outreach.</small></div></div>
          </div>
        </aside>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionIntro}>
          <div>
            <span className="sectionLabel">How it works</span>
            <h2>From scientific context to trusted action, in three deliberate steps.</h2>
          </div>
          <p>Every step is designed to protect your time and your credibility — not to maximize how long you stay.</p>
        </div>
        <div className={styles.flowGrid}>
          {howItWorks.map((step) => (
            <article className={styles.flowCard} key={step.number}>
              <span className={styles.flowNumber}>{step.number}</span>
              <strong>{step.title}</strong>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionIntro}>
          <div>
            <span className="sectionLabel">Why researchers trust it</span>
            <h2>Built to become more useful as evidence improves — not as engagement increases.</h2>
          </div>
        </div>
        <div className={styles.principlesGrid}>
          {principles.map((item) => (
            <div className={styles.principleCard} key={item.kicker}>
              <span>{item.kicker}</span>
              <strong>{item.title}</strong>
              <p>{item.copy}</p>
            </div>
          ))}
        </div>
        <div className={styles.honestNote}>
          <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3.5 19 6v5.4c0 4.3-2.6 7.4-7 9.1-4.4-1.7-7-4.8-7-9.1V6l7-2.5Z" />
            <path d="m9.2 12 1.8 1.8 3.8-4" />
          </svg>
          <p>
            Studepartment is early. We would rather tell you that plainly than manufacture numbers to look bigger
            than we are — the platform is built to earn your trust with evidence, not with claims.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.closing}>
          <div>
            <span className="eyebrow" style={{ color: "#64d2bf" }}>Get started</span>
            <h2>Bring your scientific context. Keep control of who sees it.</h2>
            <p>Create your Scientific Identity in minutes and decide, at every step, what stays private.</p>
          </div>
          <div className={styles.closingActions}>
            <Link className="primaryButton" href="/auth/sign-up">Create your scientific identity</Link>
            <Link className="secondary" href="/auth/sign-in">Sign in</Link>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} Studepartment. Medical Research Intelligence.</span>
        <Link href="/auth/sign-in">Sign in to your workspace →</Link>
      </footer>
    </div>
  );
}
