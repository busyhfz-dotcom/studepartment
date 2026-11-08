import type { Metadata } from "next";
import { StartFlow } from "./start-flow-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Research opportunities and institutional hiring",
  alternates: { canonical: "/start" },
  description:
    "Explore scholarships, research positions and funding, or introduce your institution’s next research opportunity. Browse Provenant without an account.",
};

/** Two public entry routes, backed by the live opportunity feed and institutional workspace. */
export default function StartPage() {
  return <StartFlow />;
}
