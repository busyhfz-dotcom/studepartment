"use client";

import { useEffect } from "react";

/** Progressive enhancement: content remains visible without motion or JavaScript. */
export function MotionRuntime() {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const seen = new WeakSet<Element>();
    const running = new Set<Animation>();
    let frame = 0;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (preference.matches) continue;
        const animation = entry.target.animate(
          [{ opacity: .35, transform: "translateY(16px)" }, { opacity: 1, transform: "translateY(0)" }],
          { duration: 550, easing: "cubic-bezier(.22,.72,.24,1)" },
        );
        running.add(animation);
        animation.onfinish = () => running.delete(animation);
      }
    }, { threshold: .08 });
    function scan() {
      frame = 0;
      document.querySelectorAll("[data-reveal], main article, main section, main h1").forEach((node) => {
        if (seen.has(node)) return;
        seen.add(node);
        observer.observe(node);
      });
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(scan); }
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { childList: true, subtree: true });
    const stop = () => { if (preference.matches) { running.forEach(animation => animation.cancel()); running.clear(); } };
    preference.addEventListener("change", stop);
    scan();
    return () => {
      observer.disconnect(); mutations.disconnect(); cancelAnimationFrame(frame);
      preference.removeEventListener("change", stop);
      running.forEach(animation => animation.cancel());
    };
  }, []);
  return null;
}
