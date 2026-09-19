import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { listOrganizationOptions } from "@/server/repositories/organization-repository";
import { researcherRepository } from "@/server/repositories/researcher-repository";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?callbackUrl=/onboarding");

  const [profile, organizations] = await Promise.all([
    researcherRepository.getProfileForUser(user.id),
    listOrganizationOptions(),
  ]);
  if (!profile) redirect("/auth/sign-in");

  return (
    <main className="shell onboardingShell">
      <header className="onboardingHeader">
        <Link className="backLink" href="/">← Studepartment</Link>
        <span className="eyebrow">Scientific Identity · v1 onboarding</span>
        <h1>Build the minimum identity needed for useful scientific discovery.</h1>
        <p className="lede">
          Four focused steps capture scientific context, research focus, collaboration intent, and visibility without turning onboarding into a long social-profile form.
        </p>
      </header>
      <OnboardingWizard profile={profile} organizations={organizations} />
    </main>
  );
}
