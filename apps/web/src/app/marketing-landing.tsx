import Link from "next/link";
import type { PublicOpportunityTicker } from "@/server/opportunities/public-ticker";
import { CountUp, IntroGate, Reveal } from "./marketing-landing-client";
import styles from "./marketing-landing.module.css";

/**
 * Design note (see the frontend-design skill): earlier passes over this page
 * leaned on the defaults that skill warns about — an ALL-CAPS eyebrow above
 * the headline, middle-dot-joined meta text, a "→" on every link, and a
 * fade-up reveal on every single section. Those are removed here. Motion is
 * spent in two deliberate places instead: the entrance gate (see
 * marketing-landing-client.tsx) and the departures board below, which flips
 * its rows in once on load. Everything else holds still.
 */

const gatePaths = [
  {
    id: "position",
    label: "Find a position",
    detail: "PhD, postdoc, or research role",
    targetId: "path-position",
  },
  {
    id: "grant",
    label: "Find a grant",
    detail: "Funding for your next project",
    targetId: "path-grant",
  },
  {
    id: "organization",
    label: "Post an opportunity",
    detail: "I represent an institution or lab",
    targetId: "path-organization",
  },
];

const intentPaths = [
  {
    id: "path-position",
    kicker: "Find a position",
    title: "PhD, postdoc, or research role",
    copy: "Browse verified openings worldwide with real deadlines, instead of checking a dozen university career pages by hand.",
    href: "/auth/sign-up?callbackUrl=%2Fopportunities",
    action: "Start finding positions",
  },
  {
    id: "path-grant",
    kicker: "Find a grant",
    title: "Funding for your next project",
    copy: "Filter funder opportunities by topic, country, and career stage — built for applicants who can't afford to miss a deadline.",
    href: "/auth/sign-up?callbackUrl=%2Fopportunities",
    action: "Start finding grants",
  },
  {
    id: "path-organization",
    kicker: "Post a position or grant",
    title: "I represent an institution or lab",
    copy: "Register an institutional profile, kept separate from individual researcher accounts, to post and manage opportunities.",
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
    copy: "Verified deadlines, direct application links, and institutional context, so your limited time goes toward applying, not verifying.",
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

type BoardRow = {
  id: string;
  title: string;
  meta: string;
  deadline: string;
};

function DeparturesBoard({ rows }: { rows: BoardRow[] }) {
  return (
    <aside className={styles.board} aria-label="Opportunities closing soonest">
      <div className={styles.boardHead}>
        <span>Closing soonest</span>
        <span>Deadline</span>
      </div>
      <div className={styles.boardBody}>
        {rows.length ? (
          rows.map((row, index) => (
            <div
              key={row.id}
              className={styles.boardRow}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className={styles.boardRowMain}>
                <strong>{row.title}</strong>
                <small>{row.meta}</small>
              </div>
              <span className={styles.boardDeadline}>{row.deadline}</span>
            </div>
          ))
        ) : (
          <p className={styles.tickerEmpty}>New opportunities are being added — check back shortly.</p>
        )}
      </div>
      <p className={styles.boardFoot}>Updated continuously. Sign in to filter by field and deadline.</p>
    </aside>
  );
}

export function MarketingLanding({ ticker }: { ticker: PublicOpportunityTicker }) {
  const boardRows: BoardRow[] = [...ticker.positions, ...ticker.grants]
    .slice(0, 7)
    .map((item) => ({
      id: item.id,
      title: item.title,
      meta: `${item.organization}${item.countryCode ? ` · ${item.countryCode}` : ""}`,
      deadline: item.deadlineLabel.replace(/^Deadline /, "").replace(/^Rolling.*/, "Rolling"),
    }));

  return (
    <>
      <IntroGate paths={gatePaths} />
      <div className={styles.page}>
        <header className={styles.nav}>
          <Link className={styles.brand} href="/">
            <BrandMark />
            <span>
              <strong>Studepartment</strong>
              <small>Medical research, worldwide</small>
            </span>
          </Link>
          <div className={styles.navActions}>
            <Link className="secondary" href="/auth/sign-in">Sign in</Link>
            <Link className="primaryButton" href="/auth/sign-up">Get started free</Link>
          </div>
        </header>

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <h1>Find the position or grant you qualify for, before its deadline finds you.</h1>
            <p>
              Studepartment scans real openings from universities and funders across Europe, North America, and
              Asia, so a normal connection and a few minutes a week are enough to keep up. It&apos;s free to search
              and free to apply — we charge the institutions that post, never the people applying.
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
                <span>Cost to apply</span>
              </div>
            </div>
          </div>

          <DeparturesBoard rows={boardRows} />
        </section>

        <section className={styles.intentSection}>
          <div className={styles.sectionIntro}>
            <div>
              <h2>What are you trying to do right now?</h2>
            </div>
            <p>Pick one — everything past this point is built around getting you there in the fewest steps.</p>
          </div>
          <div className={styles.intentGrid}>
            {intentPaths.map((path) => (
              <Link key={path.id} id={path.id} className={styles.intentCard} href={path.href}>
                <span className={styles.intentKicker}>{path.kicker}</span>
                <strong>{path.title}</strong>
                <p>{path.copy}</p>
                <span className={styles.intentAction}>{path.action}</span>
              </Link>
            ))}
          </div>
        </section>

        <Reveal as="section" className={styles.section}>
          <div className={styles.sectionIntro}>
            <div>
              <h2>From a two-minute profile to a verified application, in three steps.</h2>
            </div>
            <p>Every step is designed to protect your time — not to keep you scrolling.</p>
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
        </Reveal>

        <section className={styles.section}>
          <div className={styles.sectionIntro}>
            <div>
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
        </section>

        <section className={styles.section}>
          <div className={styles.closing}>
            <div>
              <h2>Your next position or grant is already listed. Go find it.</h2>
              <p>Create your profile in minutes and decide, at every step, what stays private.</p>
            </div>
            <div className={styles.closingActions}>
              <Link className="primaryButton" href="/auth/sign-up">Create your free profile</Link>
              <Link className="secondary" href="/auth/sign-in">Sign in</Link>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <span>© {new Date().getFullYear()} Studepartment. Medical research, worldwide.</span>
          <Link href="/auth/sign-in">Sign in to your workspace</Link>
        </footer>
      </div>
    </>
  );
}
