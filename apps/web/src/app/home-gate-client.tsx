"use client";

import { useState, type ReactNode } from "react";
import { StartFlow } from "./start/start-flow-client";

/**
 * The public "front door" for logged-out visitors: the researcher entry
 * flow (choose a path → explore → review → next step) is shown first, on
 * "/" itself, so a visitor gets a fast, direct route to what they came for
 * instead of a marketing page. "Main site" / "Skip — view the full site"
 * reveals the full marketing landing page in place, without changing the
 * URL — the same in-place-gate behavior the previous IntroGate modal had,
 * just as a full page instead of an overlay.
 */
export function HomeGate({ siteContent }: { siteContent: ReactNode }) {
  const [showSite, setShowSite] = useState(false);

  if (showSite) return <>{siteContent}</>;

  return <StartFlow onViewSite={() => setShowSite(true)} />;
}
