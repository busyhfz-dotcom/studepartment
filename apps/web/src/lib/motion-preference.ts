"use client";

import { useSyncExternalStore } from "react";

type Effect = "background" | "opportunities";
type Preference = "system" | "play" | "pause";
const eventName = "provenant:motion";
const current: Partial<Record<Effect, Preference>> = {};
const storageKey = (effect: Effect) => `provenant.motion.${effect}`;
let reducedMotion: MediaQueryList | undefined;

function query() {
  return reducedMotion ??= window.matchMedia("(prefers-reduced-motion: reduce)");
}

export function readMotionPreference(effect: Effect): Preference {
  if (current[effect]) return current[effect];

  try {
    const stored = localStorage.getItem(storageKey(effect));
    if (stored === "play" || stored === "pause") return stored;
  } catch {
    // A browser that blocks storage can still keep the choice for this page.
  }
  return "system";
}

export function allowsMotion(effect: Effect) {
  const preference = readMotionPreference(effect);
  return preference === "play" || (preference === "system" && !query().matches);
}

export function subscribeToMotion(listener: () => void) {
  const media = query();
  window.addEventListener(eventName, listener);
  window.addEventListener("storage", listener);
  if (media.addEventListener) media.addEventListener("change", listener);
  else media.addListener(listener);

  return () => {
    window.removeEventListener(eventName, listener);
    window.removeEventListener("storage", listener);
    if (media.removeEventListener) media.removeEventListener("change", listener);
    else media.removeListener(listener);
  };
}

export function setMotion(effect: Effect, playing: boolean) {
  const preference = playing ? "play" : "pause";
  try {
    localStorage.setItem(storageKey(effect), preference);
    delete current[effect];
  } catch {
    current[effect] = preference;
  }
  window.dispatchEvent(new Event(eventName));
}

export function useMotionPreference(effect: Effect) {
  return useSyncExternalStore(
    subscribeToMotion,
    () => allowsMotion(effect),
    () => false,
  );
}
