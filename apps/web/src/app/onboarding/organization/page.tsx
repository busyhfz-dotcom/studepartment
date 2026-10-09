import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { getOwnedOrganization } from "@/server/repositories/organization-repository";
import { OrganizationOnboardingWizard } from "./organization-onboarding-wizard";
import { ScientificBackdrop } from "@/components/design/scientific-backdrop";
import type { InstitutionalOrganizationType } from "@/lib/api-contracts";
import { safeReturnPath } from "@/lib/navigation";

export default async function OrganizationOnboardingPage({ searchParams }: { searchParams: Promise<{ type?: string; callbackUrl?: string }> }) {
  const { type, callbackUrl } = await searchParams;
  const destination = safeReturnPath(callbackUrl, "/organization/profile");
  const nextPath = "/onboarding/organization?" + new URLSearchParams({ ...(type ? { type } : {}), callbackUrl: destination });
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?callbackUrl=" + encodeURIComponent(nextPath));

  const existing = await getOwnedOrganization(user.id);
  if (existing) redirect(destination);

  return (
    <main className="shell onboardingShell">
      <ScientificBackdrop tone="light" />
      <header className="onboardingHeader">
        <Link className="backLink" href="/start">← Studepartment</Link>
        <span className="eyebrow">Institutional Identity</span>
        <h1>Register the institution, lab, or hospital you represent.</h1>
        <p className="lede">
          Institutional accounts get a distinct profile: a claimed organization record, source-of-truth
          opportunity postings, and researcher-facing verification — instead of an individual scientific
          identity.
        </p>
        <Link className="secondary" href={"/onboarding?callbackUrl=" + encodeURIComponent(safeReturnPath(callbackUrl))}>
          Applying as an individual researcher instead? Go back to the researcher path ↗
        </Link>
      </header>
      <OrganizationOnboardingWizard initialType={type as InstitutionalOrganizationType | undefined} callbackUrl={destination} />
    </main>
  );
}
