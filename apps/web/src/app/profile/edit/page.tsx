import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { researcherRepository } from "@/server/repositories/researcher-repository";
import { ProfileEditor } from "./profile-editor";

export default async function EditProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?callbackUrl=/profile/edit");

  const profile = await researcherRepository.getProfileForUser(user.id);
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
      <ProfileEditor profile={profile} />
    </main>
  );
}
