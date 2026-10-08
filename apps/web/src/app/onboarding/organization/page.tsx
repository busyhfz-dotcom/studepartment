import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { getOwnedOrganization } from "@/server/repositories/organization-repository";
import { OrganizationOnboardingWizard } from "./organization-onboarding-wizard";
import { ScientificBackdrop } from "@/components/design/scientific-backdrop";

export default async function OrganizationOnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?callbackUrl=/onboarding/organization");

  const existing = await getOwnedOrganization(user.id);
  if (existing) redirect("/organization/profile");

  return (
    <main className="shell onboardingShell">
      <ScientificBackdrop tone="light" />
      <header className="onboardingHeader">
        <Link className="backLink" href="/">← Studepartment</Link>
        <span className="eyebrow">Institutional Identity</span>
        <h1>Register the institution, lab, or hospital you represent.</h1>
        <p className="lede">
          Institutional accounts get a distinct profile: a claimed organization record, source-of-truth
          opportunity postings, and researcher-facing verification — instead of an individual scientific
          identity.
        </p>
        <Link className="secondary" href="/onboarding">
          Applying as an individual researcher instead? Go back to the researcher path ↗
        </Link>
      </header>
      <OrganizationOnboardingWizard />
    </main>
  );
}
