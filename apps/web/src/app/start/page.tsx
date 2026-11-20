import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPublicOpportunityTicker } from "@/server/opportunities/public-ticker";
import { getOpportunityCountries } from "@/server/opportunities/countries";
import { StartFlow } from "./start-flow-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Research opportunities and institutional hiring",
  alternates: { canonical: "/start" },
  description:
    "Explore scholarships, research positions and funding, or introduce your institution’s next research opportunity. Browse Provenant without an account.",
};

/** Two public entry routes, backed by the live opportunity feed and institutional workspace. */
export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  if (params.step === "paths") {
    const query = new URLSearchParams({ step: "browse" });
    for (const key of ["kind", "country", "q"] as const) {
      if (typeof params[key] === "string" && params[key]) query.set(key, params[key]);
    }
    redirect(`/start?${query}`);
  }
  if (params.step !== "browse") return <StartFlow />;
  const [ticker, countryCodes] = await Promise.all([getPublicOpportunityTicker(), getOpportunityCountries()]);
  return <StartFlow ticker={ticker} countryCodes={countryCodes} />;
}
