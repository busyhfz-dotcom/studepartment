import type { Metadata } from "next";
import { StartFlow } from "./start-flow-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Start browsing — Studepartment",
  description:
    "Browse real positions and grants on Studepartment before creating an account — pick a path, explore, and decide when to sign up.",
};

/**
 * Public researcher entry flow, ported from the "Entry flow concept" design
 * file. Same journey (choose → explore → review → next step) and visual
 * language as the concept, but backed by the real, live opportunity feed via
 * /api/v1/opportunities instead of the concept's illustrative sample data,
 * and routed through the site's real sign-up/onboarding URLs.
 */
export default function StartPage() {
  return <StartFlow />;
}
