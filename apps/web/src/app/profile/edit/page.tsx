import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { listOrganizationOptions } from "@/server/repositories/organization-repository";
import { researcherRepository } from "@/server/repositories/researcher-repository";
import { ProfileEditor } from "./profile-editor";

export default async function EditProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?callbackUrl=/profile/edit");

  const [profile, organizations] = await Promise.all([
    researcherRepository.getProfileForUser(user.id),
    listOrganizationOptions(),
  ]);
  if (!profile) redirect("/onboarding");

  return (
    <main className="shell onboardingShell">
      <Link className="backLink" href="/profile">← Back to profile</Link>
      <header className="onboardingHeader">
        <span className="eyebrow">Scientific Identity · v1</span>
        <h1>Keep your scientific identity precise, sourced, and useful.</h1>
        <p className="lede">
          Identity data is used for discovery, matching, opportunity analysis, and trusted introductions. It is not used to build a public popularity score.
        </p>
      </header>
      <ProfileEditor profile={profile} organizations={organizations} />
    </main>
  );
}
