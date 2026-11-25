"use client";

import { useSyncExternalStore } from "react";
import { isCountryCode } from "./countries";
import { opportunityRegion } from "./opportunity-filters";

const storageKey = "provenant.opportunity-country";
const changeEvent = "provenant:opportunity-country";
let fallback = "";

function readCountry() {
  try {
    return localStorage.getItem(storageKey) ?? fallback;
  } catch {
    return fallback;
  }
}

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(changeEvent, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(changeEvent, listener);
  };
}

export function useOpportunityCountry() {
  return useSyncExternalStore(subscribe, readCountry, () => "");
}

export function rememberOpportunityCountry(value: string) {
  fallback = isCountryCode(value) || opportunityRegion(value) ? value : "";
  try {
    localStorage.setItem(storageKey, fallback);
  } catch {
    // Still remember the selection during this visit if storage is disabled.
  }
  window.dispatchEvent(new Event(changeEvent));
}
