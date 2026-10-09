"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { PublicOpportunityTicker } from "@/server/opportunities/public-ticker";
import styles from "./marketing-landing.module.css";

/**
 * Scroll-triggered reveal wrapper, ported from the previous marketing page.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      const timeout = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(timeout);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Element = Tag as "div";
  return (
    <Element
      ref={ref}
      className={`${styles.revealItem} ${visible ? styles.visible : ""} ${className}`.trim()}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </Element>
  );
}

/** Mobile nav toggle used in the header. */
export function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const mobile = window.matchMedia("(max-width: 850px)");
    const previousOverflow = document.body.style.overflow;
    if (mobile.matches) document.body.style.overflow = "hidden";
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    }
    function closeOnResize() { setOpen(false); }
    window.addEventListener("keydown", closeOnEscape);
    mobile.addEventListener("change", closeOnResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      mobile.removeEventListener("change", closeOnResize);
    };
  }, [open]);

  return (
    <>
      <button
        ref={toggle}
        type="button"
        className={styles.mobileToggle}
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          {open ? <path d="m6 6 12 12M6 18 18 6" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>
      {open ? <button type="button" tabIndex={-1} className={styles.navBackdrop} aria-label="Close navigation" onClick={() => setOpen(false)} /> : null}
      <nav
        id={menuId}
        className={`${styles.nav} ${open ? styles.navOpen : ""}`}
        aria-label="Main navigation"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== toggle.current) setOpen(false);
        }}
      >
        {links.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </a>
        ))}
      </nav>
    </>
  );
}

type TickerEntry = {
  id: string;
  kind: "Position" | "Grant";
  title: string;
  organization: string;
  deadlineLabel: string;
};

function buildEntries(ticker: PublicOpportunityTicker): TickerEntry[] {
  const positions: TickerEntry[] = ticker.positions.map((item) => ({
    id: item.id,
    kind: "Position",
    title: item.title,
    organization: item.countryCode ? `${item.organization} · ${item.countryCode}` : item.organization,
    deadlineLabel: item.deadlineLabel,
  }));
  const grants: TickerEntry[] = ticker.grants.map((item) => ({
    id: item.id,
    kind: "Grant",
    title: item.title,
    organization: item.countryCode ? `${item.organization} · ${item.countryCode}` : item.organization,
    deadlineLabel: item.deadlineLabel,
  }));
  const merged: TickerEntry[] = [];
  const max = Math.max(positions.length, grants.length);
  for (let i = 0; i < max; i += 1) {
    if (positions[i]) merged.push(positions[i]);
    if (grants[i]) merged.push(grants[i]);
  }
  return merged.slice(0, 8);
}

function badgeStatus(label: string): "urgent" | "soon" | "open" {
  const lower = label.toLowerCase();
  if (lower.includes("rolling")) return "open";
  const weekMatch = lower.match(/(\d+)\s*week/);
  const dayMatch = lower.match(/(\d+)\s*day/);
  if (dayMatch && Number(dayMatch[1]) <= 14) return "urgent";
  if (weekMatch && Number(weekMatch[1]) <= 2) return "urgent";
  if (weekMatch && Number(weekMatch[1]) <= 6) return "soon";
  return "open";
}

/**
 * The hero "desk" widget: a continuously scrolling list of real live
 * opportunities pulled from the public ticker, click-to-expand into a
 * detail panel — same interaction as the design concept, real data instead
 * of the concept's illustrative sample rows.
 */
export function OpportunityTicker({ ticker }: { ticker: PublicOpportunityTicker }) {
  const entries = buildEntries(ticker);
  const [selected, setSelected] = useState<TickerEntry | null>(null);
  const [paused, setPaused] = useState(false);

  return (
    <aside className={`${styles.heroDesk} ${selected ? styles.isSelected : ""} ${paused ? styles.tickerPaused : ""}`} aria-label="Latest position and grant preview">
      <div className={styles.deskHeading}>
        <span>Latest opportunities</span>
        <span>Live from Studepartment</span>
        {entries.length ? <button
          type="button"
          className={styles.tickerMotionToggle}
          aria-label={paused || selected ? "Resume opportunity motion" : "Pause opportunity motion"}
          onClick={() => {
            if (paused || selected) { setSelected(null); setPaused(false); }
            else setPaused(true);
          }}
        >{paused || selected ? "▶ Resume" : "Ⅱ Pause"}</button> : null}
      </div>
      {entries.length ? (
        <div className={styles.latestList} aria-label="Latest opportunities; touch to pause or select a listing for details" onPointerDown={() => setPaused(true)}>
          <div className={styles.latestTrack} style={{ animationDuration: `${entries.length * 8}s` }}>
            {[false, true].map((duplicate) => (
              <div className={styles.latestGroup} aria-hidden={duplicate || undefined} key={duplicate ? "dup" : "orig"}>
                {entries.map((entry, index) => {
                  const status = badgeStatus(entry.deadlineLabel);
                  const label = status === "urgent" ? "Closing soon" : status === "soon" ? "Plan ahead" : "Time to prepare";
                  return (
                    <button
                      key={`${duplicate ? "dup-" : ""}${entry.id}-${index}`}
                      type="button"
                      className={styles.latestRow}
                      tabIndex={duplicate ? -1 : undefined}
                      aria-label={`${entry.kind}: ${entry.title}, ${entry.deadlineLabel}`}
                      onClick={() => setSelected(entry)}
                    >
                      <span>
                        <span className={styles.kind}>{entry.kind}</span>
                        <strong>{entry.title}</strong>
                        <small>{entry.organization}</small>
                      </span>
                      <span className={`${styles.deadline} ${styles[status]}`}>
                        <span className={styles.badge}>{label}</span>
                        <time>{entry.deadlineLabel}</time>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className={styles.latestLoading}>New opportunities are being added — check back shortly.</p>
      )}

      {selected ? (
        <div className={styles.opportunityDetail} role="region" aria-label="Selected opportunity" aria-live="polite">
          <div className={styles.detailTop}>
            <span>{selected.kind}</span>
            <button type="button" aria-label="Close opportunity details" onClick={() => setSelected(null)}>
              ×
            </button>
          </div>
          <h3>{selected.title}</h3>
          <p>{selected.organization}</p>
          <div className={styles.detailDeadline}>{selected.deadlineLabel}</div>
          <Link href="/opportunities">Browse opportunities ↗</Link>
        </div>
      ) : null}

      <div className={styles.deskFooter}>
        <span>Refreshed continuously from verified sources.</span>
        <Link href="/opportunities">Browse all ↗</Link>
      </div>
    </aside>
  );
}

type Surface = {
  key: string;
  number: string;
  title: string;
  copy: string;
  action: string;
  href: string;
  preview: string;
  rows: readonly (readonly [string, string])[];
};

/** Tabbed "platform surfaces" panel — Identity / Discovery / Institutions / Opportunities / Assistant. */
export function PlatformTabs({ surfaces }: { surfaces: readonly Surface[] }) {
  const tabId = useId();
  const [activeKey, setActiveKey] = useState(surfaces[0]?.key ?? "");
  const active = surfaces.find((surface) => surface.key === activeKey) ?? surfaces[0];

  return (
    <>
      <div className={styles.surfaceTabs} role="tablist" aria-label="Platform areas">
        {surfaces.map((surface) => (
          <button
            key={surface.key}
            role="tab"
            type="button"
            id={`${tabId}-${surface.key}`}
            aria-controls={`${tabId}-panel`}
            aria-selected={surface.key === activeKey}
            tabIndex={surface.key === activeKey ? 0 : -1}
            onClick={() => setActiveKey(surface.key)}
            onKeyDown={(event) => {
              const index = surfaces.findIndex((item) => item.key === surface.key);
              const nextIndex =
                event.key === "ArrowRight" ? (index + 1) % surfaces.length :
                event.key === "ArrowLeft" ? (index - 1 + surfaces.length) % surfaces.length :
                event.key === "Home" ? 0 :
                event.key === "End" ? surfaces.length - 1 : null;
              if (nextIndex === null) return;
              event.preventDefault();
              setActiveKey(surfaces[nextIndex].key);
              event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]?.focus();
            }}
          >
            {surfaceLabel(surface.key)}
          </button>
        ))}
      </div>
      {active ? (
        <div key={active.key} className={styles.surfacePanel} id={`${tabId}-panel`} role="tabpanel" aria-labelledby={`${tabId}-${active.key}`} tabIndex={0}>
          <div className={styles.surfaceContent}>
            <span className={styles.number}>{active.number}</span>
            <h3>{active.title}</h3>
            <p>{active.copy}</p>
            <Link href={active.href}>
              {active.action} <span>↗</span>
            </Link>
          </div>
          <div className={styles.instrument}>
            <div className={styles.instrumentTop}>
              <span>Research instrument / preview</span>
              <b>{active.key.toUpperCase()}</b>
            </div>
            <div className={styles.instrumentCenter}>{active.preview}</div>
            <div className={styles.instrumentLines}>
              {active.rows.map(([a, b]) => (
                <div key={a}>
                  <span>{a}</span>
                  <b>{b}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function surfaceLabel(key: string) {
  switch (key) {
    case "identity":
      return "Scientific Identity";
    case "discovery":
      return "Discovery";
    case "institutions":
      return "Institutions";
    case "opportunities":
      return "Opportunities";
    case "assistant":
      return "Research Assistant";
    default:
      return key;
  }
}

