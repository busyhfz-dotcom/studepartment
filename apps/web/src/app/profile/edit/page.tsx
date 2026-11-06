import Link from "next/link";
import { ScientificBackdrop } from "@/components/design/scientific-backdrop";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { listOrganizationOptions } from "@/server/repositories/organization-repository";
import { researcherRepository } from "@/server/repositories/researcher-repository";
import { ProfileEditor } from "./profile-editor";

export default async function EditProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/sign-in?callbackUrl=/profile/edit");

  if (user.accountKind === "INSTITUTION") redirect("/organization/profile");
  const [profile, organizations] = await Promise.all([
    researcherRepository.getProfileForUser(user.id),
    listOrganizationOptions(),
  ]);
  if (!profile) redirect("/onboarding");

  return (
    <main className="shell onboardingShell">
      <ScientificBackdrop tone="light" />
      <Link className="backLink" href="/profile">← Back to Scientific Identity</Link>

      <header className="onboardingHeader">
        <span className="eyebrow">Edit Scientific Identity</span>
        <h1>Keep your profile accurate.</h1>
        <p className="lede">
          Your research focus, collaboration preferences and visibility settings decide how you appear in search
          and which opportunities we suggest. None of it becomes a public score.
        </p>
      </header>

      <ProfileEditor profile={profile} organizations={organizations} />
    </main>
  );
}
