import { MarketingLanding } from "../marketing-landing";
import { getPublicOpportunityTicker } from "@/server/opportunities/public-ticker";

export default async function MainSitePage() {
  const ticker = await getPublicOpportunityTicker();
  return <MarketingLanding ticker={ticker} />;
}
