"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { SystemStatus } from "./system-status";
import styles from "./product-shell.module.css";

type IconName = "overview" | "discover" | "opportunity" | "introduction" | "identity" | "graph" | "assistant";

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: IconName;
};

const workspaceItems: NavItem[] = [
  { href: "/", label: "Overview", description: "Research workspace", icon: "overview" },
  { href: "/discover", label: "Discovery", description: "Find scientific matches", icon: "discover" },
  { href: "/assistant", label: "Research assistant", description: "Grounded evidence reasoning", icon: "assistant" },
  { href: "/opportunities", label: "Opportunities", description: "Positions and funding", icon: "opportunity" },
  { href: "/introductions", label: "Introductions", description: "Controlled outreach", icon: "introduction" },
];

const identityItems: NavItem[] = [
  { href: "/profile", label: "Scientific identity", description: "Profile and provenance", icon: "identity" },
  { href: "/graph", label: "Evidence graph", description: "Scientific relationships", icon: "graph" },
];

const pageNames: Array<[string, string]> = [
  ["/discover", "Scientific Discovery"],
  ["/assistant", "Research Assistant"],
  ["/opportunities", "Opportunity Intelligence"],
  ["/introductions", "Scientific Introductions"],
  ["/graph", "Scientific Evidence Graph"],
  ["/researchers", "Researcher Profile"],
  ["/profile", "Scientific Identity"],
  ["/", "Research Overview"],
];

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    overview: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    discover: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4.2-4.2" />
        <path d="M11 8v6M8 11h6" />
      </>
    ),
    opportunity: (
      <>
        <path d="M9 6V4.8A1.8 1.8 0 0 1 10.8 3h2.4A1.8 1.8 0 0 1 15 4.8V6" />
        <rect x="3" y="6" width="18" height="14" rx="3" />
        <path d="M3 11.5c4.8 2.2 13.2 2.2 18 0" />
        <path d="M10 12h4" />
      </>
    ),
    introduction: (
      <>
        <circle cx="8" cy="8" r="3" />
        <circle cx="17" cy="8" r="3" />
        <path d="M3.5 19c.5-3.2 2.2-5 4.5-5s4 1.8 4.5 5" />
        <path d="M13 19c.4-2.6 1.8-4 4-4 2.1 0 3.6 1.4 4 4" />
      </>
    ),
    identity: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21c.6-4.8 3.3-7 7.5-7s6.9 2.2 7.5 7" />
        <path d="m17.5 4.5 1 1 2-2" />
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
  };

  return (
    <svg aria-hidden="true" className={styles.navIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

function NavigationGroup({ label, items, pathname, close }: { label: string; items: NavItem[]; pathname: string; close: () => void }) {
  return (
    <div className={styles.navGroup}>
      <span className={styles.navLabel}>{label}</span>
      <nav className={styles.navList} aria-label={label}>
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link className={`${styles.navItem} ${active ? styles.navItemActive : ""}`} href={item.href} key={item.href} onClick={close}>
              <span className={styles.iconWrap}><Icon name={item.icon} /></span>
              <span className={styles.navCopy}>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
              {active ? <span className={styles.activeMark} /> : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function ProductShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageName = pageNames.find(([prefix]) => prefix === "/" ? pathname === "/" : pathname.startsWith(prefix))?.[1] ?? "Research Workspace";

  return (
    <div className={styles.frame}>
      <button className={styles.skipLink} onClick={() => document.getElementById("workspace-content")?.focus()}>Skip to workspace</button>
      <div className={`${styles.scrim} ${mobileOpen ? styles.scrimVisible : ""}`} onClick={() => setMobileOpen(false)} />

      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.brandRow}>
          <Link className={styles.brand} href="/" onClick={() => setMobileOpen(false)}>
            <span className={styles.brandMark}>S</span>
            <span>
              <strong>Studepartment</strong>
              <small>Research Intelligence</small>
            </span>
          </Link>
          <button aria-label="Close navigation" className={styles.mobileClose} onClick={() => setMobileOpen(false)} type="button">×</button>
        </div>

        <div className={styles.sidebarBody}>
          <NavigationGroup close={() => setMobileOpen(false)} items={workspaceItems} label="Workspace" pathname={pathname} />
          <NavigationGroup close={() => setMobileOpen(false)} items={identityItems} label="Identity & trust" pathname={pathname} />
        </div>

        <div className={styles.sidebarFooter}>
          <div className={styles.trustSummary}>
            <span className={styles.trustDot} />
            <div>
              <strong>Privacy-first workspace</strong>
              <small>Explainable AI · Controlled access</small>
            </div>
          </div>
          <div className={styles.version}>Platform · v1.4 release candidate</div>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button aria-label="Open navigation" className={styles.menuButton} onClick={() => setMobileOpen(true)} type="button">
              <span /><span /><span />
            </button>
            <div>
              <span className={styles.topbarEyebrow}>Medical Research Intelligence</span>
              <strong className={styles.pageName}>{pageName}</strong>
            </div>
          </div>
          <div className={styles.topbarActions}>
            <Link className={styles.quickSearch} href="/discover">
              <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>
              <span>Search research</span>
              <kbd>⌘ K</kbd>
            </Link>
            <SystemStatus />
            <Link aria-label="Open scientific identity" className={styles.avatar} href="/profile">RI</Link>
          </div>
        </header>

        <main className={styles.content} id="workspace-content" tabIndex={-1}>
          {children}
        </main>
      </section>
    </div>
  );
}
