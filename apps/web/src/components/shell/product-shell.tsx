"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ScientificBackdrop } from "@/components/design/scientific-backdrop";
import { SystemStatus } from "./system-status";
import styles from "./product-shell.module.css";

type IconName = "overview" | "discover" | "opportunity" | "introduction" | "identity" | "graph" | "assistant" | "scanner" | "conference";

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: IconName;
};

const workspaceItems: NavItem[] = [
  { href: "/", label: "Overview", description: "Research command center", icon: "overview" },
  { href: "/discover", label: "Discovery", description: "Researchers, labs, institutions", icon: "discover" },
  { href: "/assistant", label: "Research Assistant", description: "Grounded evidence reasoning", icon: "assistant" },
  { href: "/opportunities", label: "Opportunities", description: "Positions, fellowships, grants", icon: "opportunity" },
  { href: "/introductions", label: "Introductions", description: "Purpose-led scientific outreach", icon: "introduction" },
  { href: "/scanner", label: "Scanner", description: "Real-world position & grant databases", icon: "scanner" },
  { href: "/conferences", label: "Conferences", description: "Rankings, CFPs, and CME credit", icon: "conference" },
];

const identityItemsIndividual: NavItem[] = [
  { href: "/profile", label: "Scientific Identity", description: "Profile, evidence, provenance", icon: "identity" },
  { href: "/graph", label: "Evidence Graph", description: "Scientific relationships", icon: "graph" },
];

const identityItemsInstitution: NavItem[] = [
  { href: "/organization/profile", label: "Organization Profile", description: "Institutional identity & postings", icon: "identity" },
  { href: "/graph", label: "Evidence Graph", description: "Scientific relationships", icon: "graph" },
];

const pageNames: Array<[string, string]> = [
  ["/billing", "Studepartment Pro"],
  ["/discover", "Scientific Discovery"],
  ["/assistant", "Research Assistant"],
  ["/opportunities", "Opportunity Intelligence"],
  ["/introductions", "Scientific Introductions"],
  ["/graph", "Scientific Evidence Graph"],
  ["/scanner", "Scanner Directory"],
  ["/conferences", "Conferences & Credit"],
  ["/institutions", "Institutional Intelligence"],
  ["/researchers", "Researcher Profile"],
  ["/settings", "Settings"],
  ["/organization/profile", "Organization Profile"],
  ["/profile", "Scientific Identity"],
  ["/", "Research Overview"],
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

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    overview: (
      <>
        <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
      </>
    ),
    discover: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 4.5 4.5M10.5 7.5v6M7.5 10.5h6" />
      </>
    ),
    opportunity: (
      <>
        <path d="M8.5 6V4.8A1.8 1.8 0 0 1 10.3 3h3.4a1.8 1.8 0 0 1 1.8 1.8V6" />
        <rect x="3" y="6" width="18" height="14" rx="2.8" />
        <path d="M3 11.5c4.8 2.2 13.2 2.2 18 0M10 12h4" />
      </>
    ),
    introduction: (
      <>
        <circle cx="8" cy="8" r="3" />
        <circle cx="17" cy="8" r="3" />
        <path d="M3.5 19c.5-3.2 2.2-5 4.5-5s4 1.8 4.5 5M13 19c.4-2.6 1.8-4 4-4 2.1 0 3.6 1.4 4 4" />
      </>
    ),
    identity: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21c.6-4.8 3.3-7 7.5-7s6.9 2.2 7.5 7M17.5 4.5l1 1 2-2" />
      </>
    ),
    graph: (
      <>
        <circle cx="12" cy="5" r="2.5" />
        <circle cx="5" cy="17" r="2.5" />
        <circle cx="19" cy="17" r="2.5" />
        <path d="m10.7 7.2-4.4 7.6M13.3 7.2l4.4 7.6M7.5 17h9" />
      </>
    ),
    assistant: (
      <>
        <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5v-8" />
        <path d="M8 8h8M8 11h5" />
      </>
    ),
    scanner: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 12 17 8.5M12 6.5V12" />
      </>
    ),
    conference: (
      <>
        <rect x="4" y="5" width="16" height="13" rx="2" />
        <path d="M4 9.5h16M8 3.5v3M16 3.5v3M9 13.5h6" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={styles.navIcon}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.55"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function NavigationGroup({
  label,
  items,
  pathname,
  close,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  close: () => void;
}) {
  const activeItemRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [pathname]);

  return (
    <div className={styles.navGroup}>
      <span className={styles.navLabel}>{label}</span>
      <nav className={styles.navList} aria-label={label}>
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
              href={item.href}
              key={item.href}
              onClick={close}
              ref={active ? activeItemRef : undefined}
            >
              <span className={styles.iconWrap}><Icon name={item.icon} /></span>
              <span className={styles.navCopy}>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
              <span className={styles.navArrow} aria-hidden="true">›</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function ProductShell({
  children,
  accountKind = "individual",
}: {
  children: ReactNode;
  accountKind?: "individual" | "institution";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageName = pageNames.find(([prefix]) => prefix === "/" ? pathname === "/" : pathname.startsWith(prefix))?.[1] ?? "Research Workspace";
  const identityItems = accountKind === "institution" ? identityItemsInstitution : identityItemsIndividual;
  const identityHref = accountKind === "institution" ? "/organization/profile" : "/profile";

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        router.push("/discover");
      }
      if (event.key === "Escape") setMobileOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <div className={styles.frame}>
      <ScientificBackdrop className={styles.motionLayer} tone="light" />
      <button
        className={styles.skipLink}
        onClick={() => document.getElementById("workspace-content")?.focus()}
      >
        Skip to workspace
      </button>

      <div
        aria-hidden="true"
        className={`${styles.scrim} ${mobileOpen ? styles.scrimVisible : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.brandRow}>
          <Link className={styles.brand} href="/start" onClick={() => setMobileOpen(false)}>
            <BrandMark />
            <span className={styles.brandCopy}>
              <strong>Studepartment</strong>
              <small>Medical Research Intelligence</small>
            </span>
          </Link>
          <button
            aria-label="Close navigation"
            className={styles.mobileClose}
            onClick={() => setMobileOpen(false)}
            type="button"
          >
            <span />
            <span />
          </button>
        </div>

        <div className={styles.sidebarBody}>
          <NavigationGroup close={() => setMobileOpen(false)} items={workspaceItems} label="Research" pathname={pathname} />
          <NavigationGroup close={() => setMobileOpen(false)} items={identityItems} label="Identity & evidence" pathname={pathname} />
        </div>

        <div className={styles.sidebarFooter}>
          <Link className={styles.trustSummary} href="/settings/privacy">
            <span className={styles.trustGlyph} aria-hidden="true">
              <svg fill="none" viewBox="0 0 24 24">
                <path d="M12 3.5 19 6v5.4c0 4.3-2.6 7.4-7 9.1-4.4-1.7-7-4.8-7-9.1V6l7-2.5Z" />
                <path d="m9.2 12 1.8 1.8 3.8-4" />
              </svg>
            </span>
            <span>
              <strong>Privacy-first by design</strong>
              <small>Evidence-aware · User controlled</small>
            </span>
          </Link>
          <SignOutButton />
          <div className={styles.version}>
            <span>Release candidate</span>
            <strong>v1.4.0-rc.1</strong>
          </div>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              aria-label="Open navigation"
              className={styles.menuButton}
              onClick={() => setMobileOpen(true)}
              type="button"
            >
              <span /><span /><span />
            </button>
            <div className={styles.contextTitle}>
              <Link className={styles.workspaceBrand} href="/start">Studepartment</Link>
              <strong className={styles.pageName}>{pageName}</strong>
            </div>
          </div>

          <div className={styles.topbarActions}>
            <Link className={styles.quickSearch} href="/discover" title="Search scientific intelligence">
              <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
                <circle cx="10.5" cy="10.5" r="6.25" />
                <path d="m15.3 15.3 4.4 4.4" />
              </svg>
              <span>Search researchers, labs, institutions…</span>
              <kbd>⌘K</kbd>
            </Link>
            <SystemStatus />
            <Link aria-label="Open Scientific Identity" className={styles.avatar} href={identityHref}>
              <span>{accountKind === "institution" ? "IN" : "RI"}</span>
            </Link>
          </div>
        </header>
        <nav className={styles.mobileSiteLinks} aria-label="Site navigation">
          <Link href="/main-site">Main site</Link>
          <Link href="/auth/sign-in">Join free</Link>
        </nav>

        <main className={styles.content} id="workspace-content" tabIndex={-1}>
          {children}
        </main>
      </section>
    </div>
  );
}
