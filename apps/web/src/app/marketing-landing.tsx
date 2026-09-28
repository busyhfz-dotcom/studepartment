import Link from "next/link";
import type { PublicOpportunityTicker } from "@/server/opportunities/public-ticker";
import { CountUp, LivePulseStrip, Reveal } from "./marketing-landing-client";
import styles from "./marketing-landing.module.css";

const intentPaths = [
  {
    kicker: "Find a position",
    title: "PhD, postdoc, or research role",
    copy: "Browse verified openings worldwide with real deadlines — no digging through a dozen university career pages.",
    href: "/auth/sign-up?callbackUrl=%2Fopportunities",
    action: "Start finding positions",
  },
  {
    kicker: "Find a grant",
    title: "Funding for your next project",
    copy: "Filter funder opportunities by topic, country, and career stage — built for applicants who can't afford to miss a deadline.",
    href: "/auth/sign-up?callbackUrl=%2Fopportunities",
    action: "Start finding grants",
  },
  {
    kicker: "Post a position or grant",
    title: "I represent an institution or lab",
    copy: "Register a claimed institutional profile, distinct from an individual researcher identity, to post and manage opportunities.",
    href: "/auth/sign-up?callbackUrl=%2Fonboarding%2Forganization",
    action: "Create an institutional profile",
  },
];

const howItWorks = [
  {
    number: "01",
    title: "Tell us what you're looking for",
    copy: "Field, career stage, and where you're open to relocating — a two-minute profile, not a full CV rebuild.",
  },
  {
    number: "02",
    title: "We scan so you don't have to",
    copy: "Positions and grants are pulled continuously from real institutional and funder sources across every region — one place instead of dozens of tabs.",
  },
  {
    number: "03",
    title: "Apply with confidence",
    copy: "Verified deadlines, direct application links, and institutional context — so your limited time goes toward applying, not verifying.",
  },
];

const principles = [
  {
    kicker: "Cost",
    title: "Free for researchers",
    copy: "No subscription, no paywall on opportunities. We charge institutions that post — never the people applying.",
  },
  {
    kicker: "Coverage",
    title: "Worldwide, not one region",
    copy: "Europe, North America, and Asia sources are scanned together, so opportunities that never reach your inbox still reach you.",
  },
  {
    kicker: "Trust",
    title: "Reasons before rank",
    copy: "Every match shows why it's a fit — eligibility, deadline, and source — not an opaque score you have to trust blindly.",
  },
  {
    kicker: "Privacy",
    title: "Private by default",
    copy: "Nothing you enter becomes a public profile or a leaderboard. You decide what is visible, to whom.",
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

function TickerRow({ items, emptyLabel }: { items: PublicOpportunityTicker["positions"]; emptyLabel: string }) {
  if (!items.length) {
    return <p className={styles.tickerEmpty}>{emptyLabel}</p>;
  }
  const loop = [...items, ...items];
  return (
    <div className={styles.tickerTrack}>
      <div className={styles.tickerScroll}>
        {loop.map((item, index) => (
          <Link
            className={styles.tickerChip}
            href="/auth/sign-up?callbackUrl=%2Fopportunities"
            key={`${item.id}-${index}`}
          >
            <strong>{item.title}</strong>
            <span>{item.organization}{item.countryCode ? ` · ${item.countryCode}` : ""}</span>
            <small>{item.deadlineLabel}</small>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function MarketingLanding({ ticker }: { ticker: PublicOpportunityTicker }) {
  const pulseItems = [...ticker.positions, ...ticker.grants]
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      title: item.title,
      meta: `${item.organization}${item.countryCode ? ` · ${item.countryCode}` : ""}`,
    }));

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
          <Link className="primaryButton" href="/auth/sign-up">Get started free</Link>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroBackdrop} aria-hidden="true">
          <span className={styles.heroBlobOne} />
          <span className={styles.heroBlobTwo} />
          <span className={styles.heroGrid} />
        </div>

        <div className={styles.heroCopy}>
          <span className="eyebrow">Free · Worldwide · Verified deadlines</span>
          <h1>Find funded positions and grants — before the deadline finds you.</h1>
          <p>
            Studepartment scans real position and grant sources across Europe, North America, and Asia so you
            don&apos;t have to — no fees, no paywalled listings, built for researchers who can&apos;t afford to waste time.
          </p>
          <div className={styles.heroActions}>
            <Link className="primaryButton" href="/auth/sign-up">Create your free profile</Link>
            <Link className="secondary" href="/auth/sign-in">Sign in</Link>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <strong><CountUp end={ticker.stats.totalPositions} suffix="+" /></strong>
              <span>Live positions</span>
            </div>
            <div className={styles.statItem}>
              <strong><CountUp end={ticker.stats.totalGrants} suffix="+" /></strong>
              <span>Open grants</span>
            </div>
            <div className={styles.statItem}>
              <strong><CountUp end={ticker.stats.countries} suffix="+" /></strong>
              <span>Countries</span>
            </div>
            <div className={styles.statItem}>
              <strong>$0</strong>
              <span>To apply, ever</span>
            </div>
          </div>
        </div>

        <aside className={styles.heroPanel} aria-label="Live activity">
          <div className={styles.heroPanelTop}>
            <span className={styles.livePing}>
              <span className={styles.livePingDot} aria-hidden="true" />
              Live on the platform
            </span>
          </div>
          <div className={styles.heroPanelFeed}>
            {pulseItems.length ? (
              pulseItems.map((item) => (
                <div key={item.id} className={styles.heroFeedRow}>
                  <span aria-hidden="true">●</span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.meta}</small>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.tickerEmpty}>New opportunities are being added — check back shortly.</p>
            )}
          </div>
          <p className={styles.heroPanelFoot}>Updated continuously — sign in to filter by field and deadline.</p>
        </aside>
      </section>

      <LivePulseStrip items={pulseItems} label="Right now on Studepartment" />

      <Reveal as="section" className={styles.intentSection}>
        <div className={styles.sectionIntro}>
          <div>
            <span className="sectionLabel">Start here</span>
            <h2>What are you trying to do right now?</h2>
          </div>
          <p>Pick one — everything past this point is built around getting you there in the fewest steps.</p>
        </div>
        <div className={styles.intentGrid}>
          {intentPaths.map((path, index) => (
            <Reveal key={path.kicker} delay={index * 90} className={styles.intentCardWrap}>
              <Link className={styles.intentCard} href={path.href}>
                <span className={styles.intentKicker}>{path.kicker}</span>
                <strong>{path.title}</strong>
                <p>{path.copy}</p>
                <span className={styles.intentAction}>{path.action} <b>↗</b></span>
              </Link>
            </Reveal>
          ))}
        </div>
      </Reveal>

      <Reveal as="section" className={styles.section}>
        <div className={styles.sectionIntro}>
          <div>
            <span className="sectionLabel">See it for yourself</span>
            <h2>New positions and grants are added continuously.</h2>
          </div>
          <p>A live sample of currently active listings — sign in to filter by topic, method, geography, and deadline.</p>
        </div>
        <div className={styles.tickerGrid}>
          <div className={styles.tickerColumn}>
            <span className={styles.tickerLabel}>Positions · PhD, postdoc, fellowships</span>
            <TickerRow items={ticker.positions} emptyLabel="New positions are being added — check back shortly." />
          </div>
          <div className={styles.tickerColumn}>
            <span className={styles.tickerLabel}>Grants &amp; funding</span>
            <TickerRow items={ticker.grants} emptyLabel="New grants are being added — check back shortly." />
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className={styles.section}>
        <div className={styles.sectionIntro}>
          <div>
            <span className="sectionLabel">How it works</span>
            <h2>From a two-minute profile to a verified application, in three steps.</h2>
          </div>
          <p>Every step is designed to protect your time — not to keep you scrolling.</p>
        </div>
        <div className={styles.flowGrid}>
          {howItWorks.map((step, index) => (
            <Reveal key={step.number} delay={index * 90}>
              <article className={styles.flowCard}>
                <span className={styles.flowNumber}>{step.number}</span>
                <strong>{step.title}</strong>
                <p>{step.copy}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Reveal>

      <Reveal as="section" className={styles.section}>
        <div className={styles.sectionIntro}>
          <div>
            <span className="sectionLabel">Why researchers trust it</span>
            <h2>Built to stay useful even if you never pay us a cent.</h2>
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
      </Reveal>

      <Reveal as="section" className={styles.section}>
        <div className={styles.closing}>
          <div>
            <span className="eyebrow" style={{ color: "#64d2bf" }}>Get started — it&apos;s free</span>
            <h2>Your next position or grant is already listed. Go find it.</h2>
            <p>Create your profile in minutes and decide, at every step, what stays private.</p>
          </div>
          <div className={styles.closingActions}>
            <Link className="primaryButton" href="/auth/sign-up">Create your free profile</Link>
            <Link className="secondary" href="/auth/sign-in">Sign in</Link>
          </div>
        </div>
      </Reveal>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} Studepartment. Medical Research Intelligence.</span>
        <Link href="/auth/sign-in">Sign in to your workspace →</Link>
      </footer>
    </div>
  );
}
