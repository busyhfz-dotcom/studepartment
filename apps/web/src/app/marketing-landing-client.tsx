"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./marketing-landing.module.css";

/**
 * Scroll-triggered reveal wrapper. Adds a "visible" class once the element
 * enters the viewport, then stops observing. Used sparingly — see the
 * frontend-design notes in marketing-landing.tsx for why this isn't applied
 * to every section.
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
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Element = Tag as "div";
  return (
    <Element
      ref={ref}
      className={`${styles.reveal} ${visible ? styles.revealVisible : ""} ${className}`.trim()}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </Element>
  );
}

/**
 * Animated count-up used for the hero trust strip. Counts once the number
 * scrolls into view.
 */
export function CountUp({
  end,
  prefix = "",
  suffix = "",
  duration = 1100,
}: {
  end: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => setValue(end));
      return () => cancelAnimationFrame(id);
    }
    let frame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(end * eased));
            if (progress < 1) frame = requestAnimationFrame(tick);
          };
          frame = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [end, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

type GatePath = {
  id: string;
  label: string;
  detail: string;
  targetId: string;
};

const GATE_SESSION_KEY = "sp-gate-seen";

/**
 * The entrance screen requested for the marketing site: a short, animated
 * screen a visitor passes through before the main page, offering a small
 * number of simple onward paths instead of a wall of content. It renders
 * over the real page (which stays in the DOM underneath), and dismisses
 * itself either by picking a path — which scrolls the main page to the
 * matching section — or via the "Skip to the site" link. It remembers the
 * choice for the browser session so a visitor isn't gated again when they
 * come back to "/" later in the same visit.
 */
export function IntroGate({ paths }: { paths: GatePath[] }) {
  const [dismissed, setDismissed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(GATE_SESSION_KEY) === "1";
    } catch {
      seen = false;
    }
    if (seen) {
      const id = requestAnimationFrame(() => setDismissed(true));
      return () => cancelAnimationFrame(id);
    }
    firstButtonRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function close(targetId?: string) {
    try {
      sessionStorage.setItem(GATE_SESSION_KEY, "1");
    } catch {
      /* private browsing / storage disabled — gate just reappears next time */
    }
    setLeaving(true);
    window.setTimeout(() => {
      setDismissed(true);
      if (targetId) {
        const el = document.getElementById(targetId);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 280);
  }

  if (dismissed) return null;

  return (
    <div
      className={`${styles.gate} ${leaving ? styles.gateLeaving : ""}`}
      role="dialog"
      aria-label="Choose what you're looking for"
    >
      <div className={styles.gateMotif} aria-hidden="true">
        <svg viewBox="0 0 320 200" className={styles.gateRoute}>
          <path
            className={styles.gateRoutePath}
            d="M20 150 C 90 40, 210 210, 300 60"
            fill="none"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />
          <circle className={styles.gateRouteDot} cx="20" cy="150" r="4" />
          <circle className={styles.gateRouteDot} cx="300" cy="60" r="4" />
          <circle className={styles.gateRouteMover} r="3.5" />
        </svg>
        <span className={styles.gateStamp}>Funded</span>
      </div>

      <div className={styles.gateBody}>
        <p className={styles.gateEyebrow}>Studepartment</p>
        <h1 className={styles.gateHeading}>Where are you trying to get to?</h1>
        <p className={styles.gateSub}>
          Pick one — we&apos;ll take you straight there. Nothing to fill in yet.
        </p>
        <div className={styles.gatePaths}>
          {paths.map((path, index) => (
            <button
              key={path.id}
              ref={index === 0 ? firstButtonRef : undefined}
              type="button"
              className={styles.gatePathButton}
              onClick={() => close(path.targetId)}
            >
              <span className={styles.gatePathLabel}>{path.label}</span>
              <span className={styles.gatePathDetail}>{path.detail}</span>
            </button>
          ))}
        </div>
        <button type="button" className={styles.gateSkip} onClick={() => close()}>
          Skip to the site
        </button>
      </div>
    </div>
  );
}
