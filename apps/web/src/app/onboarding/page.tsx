import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { listOrganizationOptions } from "@/server/repositories/organization-repository";
import { researcherRepository } from "@/server/repositories/researcher-repository";
import { OnboardingWizard } from "./onboarding-wizard";
import { ScientificBackdrop } from "@/components/design/scientific-backdrop";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?callbackUrl=/onboarding");
  if (user.accountKind === "INSTITUTION") redirect("/onboarding/organization");

  const [profile, organizations] = await Promise.all([
    researcherRepository.getProfileForUser(user.id),
    listOrganizationOptions(),
  ]);
  if (!profile) redirect("/auth/sign-in");

  return (
    <main className="shell onboardingShell">
      <ScientificBackdrop tone="light" />
      <header className="onboardingHeader">
        <Link className="backLink" href="/start">← Studepartment</Link>
        <span className="eyebrow">Scientific Identity Calibration</span>
        <h1>Calibrate the scientific context behind every research decision.</h1>
        <p className="lede">
          Four focused steps establish your research context, methods, collaboration posture, and evidence visibility without turning identity into a social profile.
        </p>
        <Link className="secondary" href="/onboarding/organization">
          Setting up a lab, hospital, or institution instead? Switch to an institutional profile ↗
        </Link>
      </header>
      <OnboardingWizard profile={profile} organizations={organizations} initialRole={role === "student" || role === "professor" ? role : role === "researcher" ? role : undefined} />
    </main>
  );
}
