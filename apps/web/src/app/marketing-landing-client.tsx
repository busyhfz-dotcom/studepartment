"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./marketing-landing.module.css";

/**
 * Scroll-triggered reveal wrapper. Adds a "visible" class once the element
 * enters the viewport, then stops observing — this drives the fade/slide-up
 * motion used throughout the landing page without pulling in an animation
 * library. Respects prefers-reduced-motion via CSS (see module.css).
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
 * Animated count-up used for the hero trust strip (live opportunity counts,
 * countries covered, etc). Counts once the number scrolls into view.
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

export type PulseItem = {
  id: string;
  title: string;
  meta: string;
};

/**
 * Compact, always-visible proof strip for the hero fold: a pulsing "live"
 * indicator plus a slow marquee of real opportunities. This replaces relying
 * on a visitor scrolling down to be convinced anything real exists here.
 */
export function LivePulseStrip({ items, label }: { items: PulseItem[]; label: string }) {
  if (!items.length) return null;
  const loop = [...items, ...items];
  return (
    <div className={styles.pulseStrip}>
      <span className={styles.pulseDot} aria-hidden="true" />
      <span className={styles.pulseLabel}>{label}</span>
      <div className={styles.pulseTrack}>
        <div className={styles.pulseScroll}>
          {loop.map((item, index) => (
            <span className={styles.pulseChip} key={`${item.id}-${index}`}>
              <strong>{item.title}</strong>
              <small>{item.meta}</small>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
