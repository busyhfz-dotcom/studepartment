import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { listOrganizationOptions } from "@/server/repositories/organization-repository";
import { researcherRepository } from "@/server/repositories/researcher-repository";
import { OnboardingWizard } from "./onboarding-wizard";
import { ScientificBackdrop } from "@/components/design/scientific-backdrop";
import { safeReturnPath } from "@/lib/navigation";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ role?: string; callbackUrl?: string }> }) {
  const { role, callbackUrl } = await searchParams;
  const nextPath = "/onboarding?" + new URLSearchParams({ ...(role ? { role } : {}), callbackUrl: safeReturnPath(callbackUrl) });
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?callbackUrl=" + encodeURIComponent(nextPath));
  if (user.accountKind === "INSTITUTION") redirect("/onboarding/organization" + (callbackUrl ? `?callbackUrl=${encodeURIComponent(safeReturnPath(callbackUrl))}` : ""));

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
        <Link className="secondary" href={"/onboarding/organization?callbackUrl=" + encodeURIComponent(safeReturnPath(callbackUrl, "/organization/profile"))}>
          Setting up a lab, hospital, or institution instead? Switch to an institutional profile ↗
        </Link>
      </header>
      <OnboardingWizard profile={profile} organizations={organizations} callbackUrl={safeReturnPath(callbackUrl)} initialRole={role === "student" || role === "professor" ? role : role === "researcher" ? role : undefined} />
    </main>
  );
}
