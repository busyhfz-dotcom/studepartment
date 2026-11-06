import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { getOrganizationDraft, getOwnedOrganization } from "@/server/repositories/organization-repository";
import { OrganizationOnboardingWizard } from "./organization-onboarding-wizard";
import { ScientificBackdrop } from "@/components/design/scientific-backdrop";
import { safeReturnPath } from "@/lib/navigation";
import { isInstitutionalOrganizationType } from "@/server/validation/organization";

export default async function OrganizationOnboardingPage({ searchParams }: { searchParams: Promise<{ type?: string; callbackUrl?: string }> }) {
  const { type, callbackUrl } = await searchParams;
  const destination = safeReturnPath(callbackUrl, "/organization/profile");
  const nextPath = "/onboarding/organization?" + new URLSearchParams({ ...(type ? { type } : {}), callbackUrl: destination });
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?callbackUrl=" + encodeURIComponent(nextPath));

  const [existing, saved] = await Promise.all([getOwnedOrganization(user.id), getOrganizationDraft(user.id)]);
  if (existing) redirect(destination);
  const initialType = saved.typePreference ?? (isInstitutionalOrganizationType(type) ? type : undefined);

  return (
    <main className="shell onboardingShell">
      <ScientificBackdrop tone="light" />
      <header className="onboardingHeader">
        <Link className="backLink" href="/start">← Provenant</Link>
        <span className="eyebrow">Institutional Identity</span>
        <h1>Register the institution, lab, or hospital you represent.</h1>
        <p className="lede">
          Institutional accounts get their own kind of profile: an organization record, the official home for
          your postings, and a verification status that researchers can see.
        </p>
        {user.accountKind !== "INSTITUTION" ? (
          <Link className="secondary" href={"/onboarding?callbackUrl=" + encodeURIComponent(safeReturnPath(callbackUrl))}>
            Applying as an individual researcher instead? Go back to the researcher path ↗
          </Link>
        ) : null}
      </header>
      <OrganizationOnboardingWizard initialType={initialType} initialDraft={saved.draft} callbackUrl={destination} />
    </main>
  );
}
