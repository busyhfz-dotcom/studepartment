import Link from "next/link";
import { ScientificBackdrop } from "@/components/design/scientific-backdrop";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { listOrganizationOptions } from "@/server/repositories/organization-repository";
import { researcherRepository } from "@/server/repositories/researcher-repository";
import { ProfileEditor } from "./profile-editor";
import workspace from "../workspace.module.css";

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
    <main className={`shell onboardingShell ${workspace.workspace}`}>
      <ScientificBackdrop tone="light" />
      <Link className="backLink" href="/profile">← Back to Scientific Identity</Link>

      <header className={workspace.hero}>
        <div>
          <h1>Edit research profile</h1>
          <p>Update what you study, what you are open to, and who can see your profile.</p>
        </div>
      </header>

      <ProfileEditor profile={profile} organizations={organizations} />
    </main>
  );
}
