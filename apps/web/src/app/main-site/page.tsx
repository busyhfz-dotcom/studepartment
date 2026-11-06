import type { Metadata } from "next";
import { MarketingLanding } from "../marketing-landing";
import { getPublicOpportunityTicker } from "@/server/opportunities/public-ticker";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The medical research platform",
  description: "Explore Provenant's scientific profiles, research discovery, source-linked opportunities and private application tracking.",
  alternates: { canonical: "/main-site" },
};

export default async function MainSitePage() {
  const ticker = await getPublicOpportunityTicker();
  return <MarketingLanding ticker={ticker} />;
}
